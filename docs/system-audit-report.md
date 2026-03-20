# WardOS (med-cms) — System Audit & Architectural Analysis

**Scope:** Read-only analysis of the repository as of the audit date. No code changes were applied as part of this document.

**Stack (observed):** Next.js **16.1.6** (App Router), Convex (backend + realtime), Clerk (auth), `next-intl` (i18n: `en` / `tr`), React 19, `@hello-pangea/dnd` (ward map drag-and-drop).

---

## 1. System architecture & state management

### 1.1 Integration pattern

| Layer | Role |
|--------|------|
| **Clerk** | Wraps the tree in `app/layout.tsx` via `ClerkProvider`, with sign-in/up URLs derived from locale-aware path helpers. |
| **next-intl** | Server: `getLocale()` + `getMessages()` run **in parallel** via `Promise.all` in the root layout. Client subtree receives `NextIntlClientProvider` with messages. |
| **Convex** | `ConvexClientProvider` nests **inside** `NextIntlClientProvider` and uses `ConvexProviderWithClerk` + `useAuth` from Clerk, so Convex calls receive the Clerk-authenticated context. |

This ordering (Clerk → intl → Convex) is coherent: locale is available without waiting on Convex; Convex identity follows Clerk.

### 1.2 Routing & protection

- **`proxy.ts`** implements `clerkMiddleware` combined with `next-intl`’s `createMiddleware(routing)`. Protected prefixes (`/patients`, `/ward-map`, `/settings`, etc.) require `userId` from `auth()`; otherwise redirect to locale-specific sign-in with `redirect_url`. Unauthenticated users never reach dashboard routes.
- i18n uses **`localePrefix: "always"`** (`i18n/routing.ts`), so every URL carries a locale segment.

### 1.3 Data fetching & “waterfalls”

**Strengths**

- Root layout avoids a sequential locale/messages waterfall by awaiting both together.
- Dashboard screens typically use `useAuth()` for `orgId` / `userId`, then `useQuery(..., orgId ? { ... } : "skip")`, which is the standard Convex pattern and avoids firing queries without an organization.

**Observations (not necessarily bugs)**

- **`usePLGLimits`** (dashboard layout) subscribes to `getOrganizationByClerkId` and `getPatientCount` on every dashboard page. Feature pages often add their own queries (e.g. `getClinicSettings`, `getPatientsByOrganization`). This is **parallel subscription fan-out**, not a strict request waterfall, but it increases websocket/subscription work on navigation.
- **`PatientSheet`** when open runs `getClinicSettings` and `getPatientsByOrganization` together (both gated on `open && organizationId`). Reasonable for bed assignment UX; the patient list is needed for conflict checks in `buildPatientBedOptions`.

**Race conditions**

- **Clerk vs Convex:** `ConvexProviderWithClerk` is designed to align Convex auth with Clerk; typical “stale token” issues are handled by the integration rather than ad hoc code here.
- **Concurrent edits:** See **Section 5** — the dominant concurrency story is **last-write-wins** on Convex `patch`, not client-side race bugs in the hooks reviewed.

---

## 2. PII privacy engine (local roster + TC last 4 + initials)

### 2.1 Design summary

- **Server (`convex/schema.ts`):** Persists **initials** and a **4-character identifier code**, not full names — aligned with a “zero plaintext PII in Convex” posture.
- **Client (`hooks/useLocalRoster.ts`):** Stores a **browser-local** structure under `LOCAL_ROSTER_STORAGE_KEY`, with:
  - **`bedRoster`:** keyed by bed id (and legacy flat map compatibility).
  - **`patientRoster`:** keyed by **`buildPatientIdentityKey(initials, identifierCode)`** (`initials::CODE`), plus lookup by `patientId` and bed for resolution (`resolveStoredPatientName`).

### 2.2 Is it “bulletproof”?

**Solid aspects**

- **`useSyncExternalStore`** with a dedicated subscribe path (`storage` + custom event) gives consistent SSR vs client behavior (client snapshot vs server empty snapshot).
- **Sanitization** drops empty keys/values; legacy JSON shapes are migrated or safely degraded.
- **Identity key** requires a valid 4-character A–Z/0–9 code (`lib/patient-identity.ts`), matching Convex validation.

**Limits (inherent to the model)**

- **Local-only truth:** Full names are **not recoverable** from Convex if local storage is lost — by design. There is no server-side backup of plaintext names.
- **Same initials + same last-4 on different people:** Extremely unlikely in practice but **not cryptographically impossible**; the system treats that pair as one local identity bucket for naming purposes.
- **CSV import** (`lib/local-roster-csv.ts`) builds keys from bed and/or `initials`+identifier; error strings are **English-only** (see Section 4).

### 2.3 Browser cache / LocalStorage cleared

- **`getFullPatientName`** returns `localName || normalized(initials)` — so the UI always has **at least initials** from the server record.
- **Ward card** (`components/molecules/ward-patient-card.tsx`): When there is no distinct local name, `showsLocalName` is false and the secondary line shows the translated **`localNameUnavailable`** — a deliberate, graceful degradation message rather than a crash or empty state.

### 2.4 Verdict

The privacy boundary is **logically consistent** and degrades **gracefully** when LocalStorage is empty. It is **not** “bulletproof” against user data loss (clearing storage loses local full names permanently) — that is a **product tradeoff**, not an implementation bug.

---

## 3. Clinical conventions (rule engine) — gap analysis

### 3.1 What exists today

- **Storage:** `clinicSettings.conventions` in Convex (`clinicConventionsValidator` — array of rules or legacy string).
- **Authoring UI:** `app/[locale]/(dashboard)/settings/conventions/page.tsx` loads rules via `parseConventionRules`, edits them, and auto-saves with `upsertClinicSettings`.
- **Preservation on other saves:** Ward map settings save passes through `settings.conventions` so rules are **not wiped** when editing layout (`settings/ward-map/page.tsx`).

**Data model** (`lib/clinic-settings.ts`): Each rule has `sourceField` (`diagnosis` | `surgery`), `operator: "contains"`, `matchValue`, and `checklistItem` (the human-facing reminder).

### 3.2 Where enforcement is missing

**Grep-backed conclusion:** `parseConventionRules` / `ConventionRule` evaluation is **only** used in the **settings conventions page**. There is **no** import of these rules into:

- `components/organisms/patient-sheet.tsx`
- `hooks/usePatientSheetForm.ts`
- `app/[locale]/(dashboard)/ward-map/page.tsx`
- `convex/patients.ts` mutations

So today, conventions are **configuration stored in the database**, not an enforced rule engine in the clinical UI or on the server.

### 3.3 How integration *should* work (recommended direction)

**A. Shared evaluator (single source of truth)**

Introduce a pure function, e.g. `evaluateConventions(rules, patientLike)`, returning matched rules and/or severity. Input fields should mirror persisted patient fields: `diagnosis`, `surgeryDate` / surgery-related text (today `surgery` in rules likely maps to **surgery date string** or future surgery notes — the schema only has `surgeryDate` on patients; **confirm product intent** for “Surgery” matching).

**B. `patient-sheet.tsx` / `usePatientSheetForm`**

- `useQuery(getClinicSettings)` is already called when the sheet is open — extend usage to read **`conventions`**.
- On **change** (or on submit): run the evaluator; show **non-blocking** alerts (banner or inline list) for `checklistItem` text for each matched rule.
- Optional: block save only if product requires “hard” enforcement (would need explicit UX and possibly server validation).

**C. Ward map**

- Same `getClinicSettings` query is already on the ward map page — pass **matched rules** into `WardPatientCard` or a small **badge / icon** (e.g. “⚠ checklist”) with tooltip or abbreviated text.
- Keeps doctors aware **before** opening the sheet.

**D. Server-side (optional but stronger)**

- In `upsertPatient`, after `sanitizePatientFields`, optionally **reject** or **warn** based on the same rules (rules would need to be loaded from `clinicSettings` in the mutation). This prevents bypass via API manipulation and aligns UI with backend policy.

---

## 4. UI/UX, mobile & i18n

### 4.1 Ward map: `@hello-pangea/dnd` vs touch

- The live ward UI wraps the board in **`DragDropContext`** (`ward-map/page.tsx`) with **`Draggable`** cards and **`Droppable`** beds/lanes.
- **`@hello-pangea/dnd` v18** includes touch support improvements over legacy `react-beautiful-dnd`, but **drag-and-drop on mobile browsers** remains **less reliable** than desktop (scroll conflicts, hit targets, iOS Safari quirks).

**Mitigation already in the app**

- **`WardPatientCard`** registers **`onClick`** / keyboard activation to open **`PatientSheet`** when not dragging — so **tap-to-edit** is a first-class path for mobile and when drag is awkward.
- **`isDragDisabled`** / `draggingEnabled={!isLocked}` disables drag when PLG locks the org.

**Assessment:** Touch users are **not** solely dependent on DnD; the **sheet flow** is the accessible fallback. For heavy mobile ward use, consider future **explicit “Move to…”** control inside the sheet or a native-friendly bottom sheet pattern — not required for this audit, but a product enhancement axis.

### 4.2 i18n (`next-intl`)

**Strengths**

- Most user-visible surfaces use `useTranslations` with namespaces (`WardMap`, `PatientSheet`, `RuleBuilderRow`, etc.).
- **`RuleBuilderRow`** overrides `CONVENTION_SOURCE_OPTIONS` labels/descriptions with `t(\`sourceOptions.${value}.*\`)` — good pattern.

**Gaps (hardcoded or English-only)**

| Location | Issue |
|----------|--------|
| `app/[locale]/(dashboard)/layout.tsx` | Screen-reader-only `SheetTitle` / `SheetDescription` are **hardcoded English** (“Workspace navigation”, etc.). |
| `lib/local-roster-csv.ts` | Throws fixed **English** error messages for CSV validation failures. |
| `lib/clinic-settings.ts` | Default `CONVENTION_SOURCE_OPTIONS` strings are English; **overridden in UI** for `RuleBuilderRow`, but any other consumer would see English. |
| `hooks/usePatientSheetForm.ts` / `lib/ward-map-display.ts` | `default` branches return **`error.message`** from Convex/validators — often **English** (e.g. `"Diagnosis is required."` from `requireText`). Mapped errors are translated; unmapped server errors are not. |
| `convex/*.ts` | Server throws English `Error` strings; only some are mapped on the client. |

**Error boundaries**

- No dedicated `error.tsx` / `global-error.tsx` files were found in the repo snapshot — **Next.js default error UI** may appear for runtime errors, typically **not** wired through `next-intl`.

---

## 5. Real-time conflict handling (Convex `patch`)

### 5.1 Patient document updates

`upsertPatient` (`convex/patients.ts`):

- On update, loads the existing doc once, checks **organization** match, then **`ctx.db.patch(patientId, patientFields)`** with the **full sanitized payload** from the client.
- There is **no** document version, **no** optimistic concurrency token, and **no** field-level merge.

### 5.2 Two doctors editing the same patient

- **Scenario:** Doctor A and Doctor B both load the patient; A saves diagnosis D1; B saves diagnosis D2 a moment later.
- **Outcome:** **Last successful mutation wins.** The second `patch` overwrites the entire set of writable fields supplied by that client (subject to `sanitizePatientFields`).
- **Realtime:** Convex subscriptions will push the **final** document to all clients — both see consistency with the server, but **no merge UI** and **no conflict notification**.

### 5.3 Bed moves

`updatePatientBed` patches only `bedId`. Concurrent moves of **different** patients to the **same** bed are guarded by the **unique index** query and throw **“That bed is already assigned…”**. Concurrent edits to **different** fields still behave as separate last-writes if combined into one patient update via `upsertPatient`.

---

## 6. Architectural strengths (summary)

1. **Clear separation of PII:** Names stay in LocalStorage; Convex holds de-identified identifiers — matches stated privacy goals.
2. **Provider ordering** and **locale + messages** loading are sound.
3. **Ward map** combines optimistic UI for bed moves with rollback on mutation failure.
4. **Conventions settings** are **preserved** when saving ward layout (pass-through of `conventions`).
5. **Internationalization** is first-class in most feature components; Turkish locale file exists alongside English.

---

## 7. Priority findings (ranked)

| Priority | Finding |
|----------|---------|
| **P0** | **Clinical conventions are not enforced** anywhere outside Settings — no evaluator in patient sheet, ward map, or Convex mutations. |
| **P1** | **Concurrent diagnosis edits** are **last-write-wins** with no merge or conflict UX. |
| **P2** | **Untranslated** Convex/default error strings and **hardcoded** a11y copy in dashboard layout; CSV errors English-only. |
| **P3** | Subscription **fan-out** (`usePLGLimits` + page queries) — optimize if performance becomes an issue. |

---

## 8. Suggested next steps (analysis only — not implemented here)

1. Add a **pure `evaluateConventions`** (and unit tests) aligned with `ConventionRule` + patient field shapes.
2. Wire **warnings** into `PatientSheet` and **ward cards** using existing `getClinicSettings` queries.
3. Optionally add **server-side** convention checks in `upsertPatient` for policy enforcement.
4. Map remaining **`requireText`** / validator errors to **next-intl** keys or stable error codes.
5. For high-stakes edits, consider **`_version`** or **update timestamp** optimistic locking on `patients` if product requires conflict detection.

---

*End of report.*
