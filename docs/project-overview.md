# WardOS — Current State & Project Overview

> **Version:** 1.0  
> **Generated:** March 2026  
> **Classification:** Internal Technical Documentation

---

## Table of Contents

1. [Executive Summary & Vision](#1-executive-summary--vision)
2. [Key Features & Clinical Workflows](#2-key-features--clinical-workflows)
3. [The Privacy Engine (Zero-Liability PII Architecture)](#3-the-privacy-engine-zero-liability-pii-architecture)
4. [The Clinical Rule Engine (Decision Support)](#4-the-clinical-rule-engine-decision-support)
5. [Tech Stack & Architecture](#5-tech-stack--architecture)
6. [SaaS, PLG & Concurrency Security](#6-saas-plg--concurrency-security)

---

## 1. Executive Summary & Vision

### What is WardOS?

**WardOS** is a **privacy-first, real-time clinical ward management SaaS** designed specifically for **doctors** and **surgical assistants** working in hospital wards. It provides a modern, intuitive interface for managing patient census, bed allocation, surgical schedules, and clinical rounding workflows—all while maintaining strict compliance with healthcare privacy regulations (KVKK/HIPAA).

### The Core Problem

Traditional ward management relies on paper-based rounding sheets, whiteboard bed maps, and fragmented communication. This leads to:

- **Medical oversights** — Critical pre-operative requirements missed
- **Inefficient rounds** — Doctors waste time cross-referencing systems
- **Data liability** — Patient names stored in insecure cloud systems
- **Collaboration friction** — Multiple doctors editing the same patient record simultaneously

### The WardOS Solution

WardOS addresses these challenges through:

| Challenge | WardOS Solution |
|-----------|-----------------|
| Paper-based workflows | Real-time digital ward map with drag-and-drop |
| Privacy compliance | Zero-PII backend architecture (names never leave the browser) |
| Medical oversights | Rule-based clinical decision support |
| Multi-user conflicts | Optimistic locking prevents data loss |
| Accessibility | Multi-language support (Turkish/English) |

### Target Users

- **Attending Physicians** — Ward oversight, patient assignments, clinical decisions
- **Surgical Assistants** — Pre-op checklist tracking, rounding preparation
- **Clinic Administrators** — Ward layout configuration, rule management, billing

---

## 2. Key Features & Clinical Workflows

### 2.1 Interactive Ward Map (Drag-and-Drop Bed Assignment)

The ward map provides a **card-based board interface** for visualizing the entire ward at a glance:

```
┌─────────────────────────────────────────────────────────┐
│  📋 WAITING FOR BED PLACEMENT (Staging Area)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Patient A│  │ Patient B│  │ Patient C│               │
│  └──────────┘  └──────────┘  └──────────┘               │
├─────────────────────────────────────────────────────────┤
│  🏥 Room 101              │  🏥 Room 102                 │
│  ┌─────┐ ┌─────┐          │  ┌─────┐ ┌─────┐            │
│  │Bed 1│ │Bed 2│          │  │Bed 1│ │Bed 2│            │
│  └─────┘ └─────┘          │  └─────┘ └─────┘            │
└─────────────────────────────────────────────────────────┘
```

**Key Capabilities:**

- **Drag-and-drop** patient cards between beds (powered by `@hello-pangea/dnd`)
- **Real-time sync** across all connected users via Convex subscriptions
- **Visual indicators** for patients with pending clinical requirements (amber badge)
- **Bed conflict detection** — prevents assigning two patients to the same bed
- **Staging lane** — holds patients awaiting bed assignment

**Implementation Details:**

- Ward layout is configured in `/settings/ward-map` (rooms, bed counts, custom bed IDs)
- Patient cards display: initials, identifier code, diagnosis, admission day count
- `DragDropContext` wraps the entire map with droppable zones per bed slot

### 2.2 Visit Mode (Print-Optimized A4 Rounding Sheets)

The Visit page (`/visit`) transforms patient data into **print-optimized rounding sheets** designed for A4 paper:

| Bed | Full Name | Days | Diagnosis | Drains/Fluids | Notes |
|-----|-----------|------|-----------|---------------|-------|
| 101-1 | Ahmet Y*** | POD 3 | Cholecystectomy | _(blank)_ | _(blank)_ |
| 101-2 | Mehmet K*** | AD 5 | Appendicitis | _(blank)_ | _(blank)_ |

**Features:**

- **Dual-view design** — Interactive cards for screen, compact table for print
- **Tailwind print utilities** — `print:hidden`, `print:table`, `print:flex` for layout control
- **Day calculations** — Shows "POD X" (post-op day) or "AD X" (admission day)
- **Sorted by ward layout** — Patients appear in physical ward order
- **One-click print** — Browser print dialog with optimized pagination

### 2.3 Staging / Waiting List

Patients who have been admitted but not yet assigned a bed live in the **Staging Area**:

- **Constant:** `STAGING_BED_ID = "STAGING"`
- **Multiple patients** can share staging (no conflict check)
- **Automatic placement** — New patients default to staging
- **Easy assignment** — Drag from staging to any empty bed

### 2.4 Dynamic Bed Allocation

Bed management is fully dynamic:

- **Room configuration** — Define rooms with names and bed capacities
- **Custom bed IDs** — Optional override for non-sequential numbering
- **Bed ID format** — `{roomId}-bed-{number}` (e.g., `room-101-bed-2`)
- **Conflict prevention** — Server rejects duplicate bed assignments via `by_organization_bed_id` index

### 2.5 Multi-Language Support (TR/EN)

WardOS supports **Turkish** and **English** with full i18n coverage:

- **Locale-prefixed URLs** — `/en/dashboard`, `/tr/dashboard`
- **Complete translations** — All UI strings in `messages/en.json` and `messages/tr.json`
- **Language switcher** — Accessible from the header
- **Locale-aware formatting** — Dates, initials generation, error messages

---

## 3. The Privacy Engine (Zero-Liability PII Architecture)

### 3.1 The Privacy Challenge

Healthcare applications face a fundamental tension:

- **Clinical utility** requires patient names for identification
- **Privacy regulations** (KVKK, HIPAA) demand PII protection
- **Cloud storage** of names creates liability and breach risk

### 3.2 The WardOS Approach: Client-Side PII Isolation

WardOS implements a **split-storage architecture** where identifying information never reaches the server:

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              LocalStorage: wardos_local_roster           │    │
│  │  ┌─────────────────────────────────────────────────┐     │    │
│  │  │  "A*** Y***::1234" → "Ahmet Yılmaz"             │     │    │
│  │  │  "M*** K***::5678" → "Mehmet Kaya"              │     │    │
│  │  │  "room-101-bed-1"  → "Ahmet Yılmaz"             │     │    │
│  │  └─────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Only initials + 4-char code
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONVEX (Server/Cloud)                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    patients table                        │    │
│  │  ┌───────────────┬──────────────┬──────────────────┐     │    │
│  │  │   initials    │identifierCode│    diagnosis     │     │    │
│  │  ├───────────────┼──────────────┼──────────────────┤     │    │
│  │  │  "A*** Y***"  │    "1234"    │ "Cholecystectomy"│     │    │
│  │  │  "M*** K***"  │    "5678"    │ "Appendicitis"   │     │    │
│  │  └───────────────┴──────────────┴──────────────────┘     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 What the Server Stores (Convex Backend)

The `patients` table contains **only de-identified fields**:

| Field | Type | Example | Privacy Impact |
|-------|------|---------|----------------|
| `initials` | string | `"A*** Y***"` | Masked, non-identifying |
| `identifierCode` | string | `"1234"` | Last 4 digits of TC/Protocol |
| `diagnosis` | string | `"Cholecystectomy"` | Clinical, not identifying |
| `procedureName` | string | `"Laparoscopic"` | Clinical, not identifying |
| `bedId` | string | `"room-101-bed-1"` | Location only |
| `admissionDate` | string | `"2026-03-20"` | Temporal, not identifying |

**The server NEVER stores:**

- Full patient names
- National ID numbers (TC Kimlik)
- Protocol numbers
- Any directly identifying PII

### 3.4 What the Browser Stores (LocalStorage)

Full names are stored **exclusively in the browser** under the key `wardos_local_roster`:

```typescript
type LocalRosterStore = {
  bedRoster: Record<string, string>    // bedId → fullName
  patientRoster: Record<string, string> // identityKey → fullName
}
```

**Identity Key Format:** `initials::identifierCode` (e.g., `"A*** Y***::1234"`)

### 3.5 Initials Generation Algorithm

When a user enters a patient name, WardOS generates masked initials:

```typescript
function generatePatientInitials(fullName: string, locale: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((token) => `${token.charAt(0).toLocaleUpperCase(locale)}***`)
    .join(" ")
}

// "Ahmet Yılmaz" → "A*** Y***"
// "Fatma Nur Demir" → "F*** N*** D***"
```

### 3.6 CSV Roster Sync

Clinics can bulk-import patient name mappings via CSV upload:

**Supported CSV Columns:**

| Column Type | Accepted Headers |
|-------------|------------------|
| Patient Name | `Patient Name`, `Full Name`, `Name` |
| Bed ID | `Bed Number`, `Bed`, `Bed ID` |
| Initials | `Initials`, `Patient Initials` |
| Identifier | `Identifier Code`, `Last 4`, `MRN Last 4` |

**Import Flow:**

1. User uploads CSV via drag-and-drop in `LocalSyncModal`
2. `Papa.parse` extracts rows
3. `buildRosterFromCsv()` creates mappings
4. `setRoster()` persists to LocalStorage
5. **Names never leave the browser**

### 3.7 Privacy Fallback Behavior

If a user clears their LocalStorage or accesses from a new device:

- Full names are **not recoverable** from the server
- UI gracefully falls back to displaying `initials` only
- Clinical functionality remains intact (diagnosis, bed, dates all preserved)

---

## 4. The Clinical Rule Engine (Decision Support)

### 4.1 Purpose

The Rule Engine enables clinic administrators to create **If/Then rules** that automatically surface clinical requirements based on patient data. This prevents medical oversights by ensuring critical pre-operative or diagnostic requirements are never missed.

### 4.2 Rule Data Model

Rules are stored in `clinicSettings.conventions` per organization:

```typescript
type ConventionRule = {
  id: string
  sourceField: "diagnosis" | "surgery"
  operator: "contains"
  matchValue: string
  checklistItem: string
}
```

**Example Rules:**

| If | Contains | Then Require |
|----|----------|--------------|
| Diagnosis | "cholecystectomy" | "Check INR levels" |
| Diagnosis | "diabetes" | "Blood glucose monitoring" |
| Surgery | "laparoscopic" | "Consent for conversion to open" |
| Diagnosis | "anticoagulant" | "Stop Warfarin 5 days pre-op" |

### 4.3 Rule Evaluation

Rules are evaluated **client-side** in real-time as patient data changes:

```typescript
function evaluatePatientRules(
  patient: { diagnosis: string; procedureName?: string },
  conventions: ConventionRule[]
): string[] {
  const matched: string[] = []

  for (const rule of conventions) {
    const haystack = rule.sourceField === "diagnosis"
      ? patient.diagnosis
      : patient.procedureName

    if (containsIgnoreCase(haystack, rule.matchValue)) {
      matched.push(rule.checklistItem)
    }
  }

  return matched // Unique checklist items
}
```

### 4.4 UI Integration

**Ward Map Patient Cards:**

When a patient matches one or more rules, an amber badge appears:

```
┌─────────────────────┐
│ A*** Y***  [🗒️]    │  ← Amber clipboard icon
│ Cholecystectomy     │
│ POD 2               │
└─────────────────────┘
```

Hovering reveals: *"Required actions pending"*

**Patient Sheet Clinical Requirements Alert:**

The patient detail sheet displays a full requirements panel:

```
┌─────────────────────────────────────────────────┐
│  ⚠️ PENDING REQUIREMENTS                         │
│  ┌─────────────────────────────────────────────┐│
│  │ ☐ Check INR levels              [Rule]      ││
│  │ ☐ Stop Warfarin 5 days pre-op   [Rule]      ││
│  │ ☐ Blood glucose monitoring      [Custom]    ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  ✅ COMPLETED                                    │
│  ┌─────────────────────────────────────────────┐│
│  │ ☑ Pre-op chest X-ray            [Rule]      ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

- **Rule-derived items** show a "Rule" tag
- **Custom todos** can be added manually
- **Completion tracking** persists in `patient.completedRequirements`

### 4.5 Rule Management UI

Administrators configure rules at `/settings/conventions`:

```
┌─────────────────────────────────────────────────────────────┐
│  IF  [Diagnosis ▼]  contains  [cholecystectomy    ]         │
│  THEN require  [Check INR levels                  ]         │
│                                              [🗑️ Remove]   │
├─────────────────────────────────────────────────────────────┤
│  IF  [Surgery ▼]    contains  [laparoscopic       ]         │
│  THEN require  [Consent for conversion to open    ]         │
│                                              [🗑️ Remove]   │
├─────────────────────────────────────────────────────────────┤
│                                    [+ Add Rule]             │
└─────────────────────────────────────────────────────────────┘
```

- **Auto-save** — Changes persist automatically (debounced 600ms)
- **Validation** — Empty rules are rejected server-side

---

## 5. Tech Stack & Architecture

### 5.1 Core Technologies

| Layer | Technology | Version | Role |
|-------|------------|---------|------|
| **Framework** | Next.js | 16.1.6 | App Router, SSR, API routes |
| **UI Library** | React | 19.2.3 | Component architecture |
| **Language** | TypeScript | ^5 | Type safety |
| **Backend** | Convex | ^1.33.1 | Real-time database, serverless functions |
| **Auth** | Clerk | ^7.0.4 | Authentication, organization management |
| **Styling** | Tailwind CSS | ^4 | Utility-first CSS |
| **Components** | Shadcn/UI | ^4.0.8 | Headless component library |
| **i18n** | next-intl | ^4.8.3 | Internationalization |
| **Drag-n-Drop** | @hello-pangea/dnd | — | Ward map interactions |

### 5.2 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Next.js App Router                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │  │
│  │  │/dashboard│  │/ward-map │  │  /visit  │  │/settings │    │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │                    React Components                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │  │
│  │  │ WardMapHero  │  │ PatientSheet │  │ VisitRoundsCard  │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │  ┌──────────────────┐  ┌──────────────────────────────┐    │  │
│  │  │  LocalStorage    │  │  Convex React Hooks          │    │  │
│  │  │  (PII Names)     │  │  useQuery / useMutation      │    │  │
│  │  └──────────────────┘  └──────────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket (Real-time sync)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                        CONVEX BACKEND                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Functions Layer                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │  │
│  │  │   patients   │  │clinicSettings│  │  organizations   │  │  │
│  │  │  .ts queries │  │  .ts queries │  │    .ts queries   │  │  │
│  │  │  & mutations │  │  & mutations │  │    & mutations   │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │                    Database Tables                          │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌────────┐  ┌──────────┐  │  │
│  │  │ patients │  │clinicSettings│  │  orgs  │  │auditLogs │  │  │
│  │  └──────────┘  └──────────────┘  └────────┘  └──────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ JWT Validation
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                          CLERK                                    │
│  ┌──────────────────┐  ┌──────────────────┐                      │
│  │  Authentication  │  │   Organizations  │                      │
│  │     (Users)      │  │    (Tenants)     │                      │
│  └──────────────────┘  └──────────────────┘                      │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 Directory Structure

```
med-cms/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Locale-based routing (en, tr)
│   │   ├── (auth)/               # Auth routes (sign-in, sign-up)
│   │   ├── (dashboard)/          # Protected dashboard routes
│   │   │   ├── dashboard/
│   │   │   ├── patients/
│   │   │   ├── ward-map/
│   │   │   ├── visit/
│   │   │   └── settings/
│   │   └── (super-admin)/        # Super admin routes
│   └── api/                      # API routes (webhooks, payments)
├── components/
│   ├── ui/                       # Shadcn primitives
│   ├── molecules/                # Small compound components
│   └── organisms/                # Large feature components
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema
│   ├── patients.ts               # Patient queries/mutations
│   ├── clinicSettings.ts         # Settings queries/mutations
│   └── organizations.ts          # Org queries/mutations
├── hooks/                        # React hooks
│   ├── useLocalRoster.ts         # LocalStorage PII management
│   ├── usePLGLimits.ts           # Trial limit state
│   └── useWardMapBoard.ts        # Ward map state
├── lib/                          # Utilities
│   ├── patient-privacy.ts        # Initials generation
│   ├── patient-identity.ts       # Identity key building
│   ├── rule-engine.ts            # Convention evaluation
│   └── commercial.ts             # PLG limits
├── i18n/                         # next-intl configuration
├── messages/                     # i18n JSON catalogs
│   ├── en.json
│   └── tr.json
└── docs/                         # Documentation
```

### 5.4 Data Flow: Real-Time Subscriptions

Convex provides automatic real-time sync via WebSocket subscriptions:

```typescript
// Client subscribes to patient list
const patients = useQuery(api.patients.getPatientsByOrganization, { orgId })

// When ANY client mutates, ALL subscribers receive updates
const upsertPatient = useMutation(api.patients.upsertPatient)
```

**Benefits:**

- No manual refresh needed
- Multiple doctors see changes instantly
- Optimistic UI updates with automatic rollback on failure

---

## 6. SaaS, PLG & Concurrency Security

### 6.1 Product-Led Growth (PLG) Model

WardOS uses a **freemium model** with a soft-lock mechanism:

| Tier | Patient Limit | Features |
|------|---------------|----------|
| **Free Trial** | 50 patients | Full features, read-only after limit |
| **Active Subscription** | Unlimited | Full features |

### 6.2 The 50-Patient Soft Lock

**Constant:** `FREE_TRIAL_PATIENT_LIMIT = 50`

**Lock Detection:**

```typescript
function isOrganizationLocked(
  patientCount: number,
  subscriptionStatus?: string | null
): boolean {
  return (
    patientCount >= FREE_TRIAL_PATIENT_LIMIT &&
    normalizeSubscriptionStatus(subscriptionStatus) !== "active"
  )
}
```

**Server-Side Enforcement:**

The `upsertPatient` mutation blocks new patients when locked:

```typescript
if (patientCount >= FREE_TRIAL_PATIENT_LIMIT && subscriptionStatus !== "active") {
  throw new Error("TRIAL_LIMIT_REACHED")
}
```

**Soft-Lock Behavior:**

| Action | Locked State |
|--------|--------------|
| View patients | ✅ Allowed |
| View ward map | ✅ Allowed |
| Print visit sheets | ✅ Allowed |
| Add new patient | ❌ Blocked |
| Edit existing patient | ❌ Blocked |
| Drag-and-drop beds | ❌ Disabled |

**UI Indicators:**

- `UpgradeBanner` appears above dashboard
- "Read-only at free limit" badge on patients page
- Disabled "New Patient" button
- Ward map drag handles hidden

### 6.3 Optimistic Locking (Concurrency Control)

**The Problem:** Multiple doctors editing the same patient simultaneously can cause data loss (last write wins).

**The Solution:** Version-based optimistic locking.

**Schema:**

```typescript
patients: defineTable({
  // ... other fields
  version: v.optional(v.number()), // Optimistic-lock counter
})
```

**Server Logic:**

```typescript
// In upsertPatient mutation (update path)
const serverVersion = existingPatient.version ?? 0
const clientVersion = args.version ?? 0

if (clientVersion !== serverVersion) {
  throw new Error(
    "CONFLICT: This patient was updated by another user. Please refresh and try again."
  )
}

const nextVersion = serverVersion + 1

await ctx.db.patch(patientId, {
  ...patientFields,
  version: nextVersion,
})
```

**Conflict Flow:**

```
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│  Doctor A   │          │   Server    │          │  Doctor B   │
└──────┬──────┘          └──────┬──────┘          └──────┬──────┘
       │                        │                        │
       │  Load patient (v: 1)   │                        │
       │◄───────────────────────│                        │
       │                        │   Load patient (v: 1)  │
       │                        │───────────────────────►│
       │                        │                        │
       │  Edit diagnosis        │                        │
       │  Save (v: 1 → 2)       │                        │
       │───────────────────────►│                        │
       │                        │   ✅ Success (v: 2)    │
       │                        │                        │
       │                        │   Edit procedure       │
       │                        │   Save (v: 1 → 2)      │
       │                        │◄───────────────────────│
       │                        │   ❌ CONFLICT!         │
       │                        │───────────────────────►│
       │                        │                        │
       │                        │   User sees warning:   │
       │                        │   "Please refresh"     │
       │                        │                        │
```

**Client Handling:**

```typescript
if (error.message.startsWith("CONFLICT:")) {
  toast.warning("This patient was updated by another user. Please refresh.")
  return
}
```

### 6.4 Multi-Tenant Isolation

**Organization Scoping:**

Every data query is scoped by `organizationId`:

```typescript
// All patient queries use organization index
.withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
```

**Cross-Tenant Protection:**

Mutations verify organization ownership:

```typescript
if (existingPatient.organizationId !== args.organizationId) {
  throw new Error("You cannot update a patient outside your organization.")
}
```

**Clerk Integration:**

- Organizations are synced from Clerk via webhooks
- `orgId` from `useAuth()` is used for all data access
- New organizations start with `subscriptionStatus: "trial"`

### 6.5 Audit Logging

All significant actions are logged to the `auditLogs` table:

```typescript
await ctx.runMutation(internal.audit.recordAuditLog, {
  organizationId,
  userId,
  action: "patient.bed.update",
  timestamp: Date.now(),
})
```

**Indexed for:**

- `by_organization_id` — View all org activity
- `by_organization_timestamp` — Time-range queries
- `by_user_id` — User-specific audit trails

---

## Appendix: Quick Reference

### Key Files

| Path | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema definition |
| `convex/patients.ts` | Patient CRUD operations |
| `lib/patient-privacy.ts` | Initials generation, staging constant |
| `lib/rule-engine.ts` | Clinical rule evaluation |
| `lib/commercial.ts` | PLG limits and lock detection |
| `hooks/useLocalRoster.ts` | LocalStorage PII management |
| `hooks/usePLGLimits.ts` | Subscription state hook |

### Environment Variables

| Variable | Service |
|----------|---------|
| `CLERK_*` | Clerk authentication |
| `CONVEX_*` | Convex backend |
| `NEXT_PUBLIC_*` | Client-side config |

### Supported Locales

- `en` — English (default)
- `tr` — Turkish

---

*This document provides a comprehensive overview of WardOS as of March 2026. For implementation details, refer to inline code documentation and the changelog at `docs/changelog.md`.*
