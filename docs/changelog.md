# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- Phase 10 i18n foundation with `next-intl`, locale-prefixed `en` and `tr` routes, message catalogs, and a dashboard language switcher.
- Local patient-name persistence by `patientId`, allowing manual admission forms to keep full names browser-only while Convex stores only masked initials.
- A 4-character `identifierCode` on patient records plus identity-keyed local roster matching so staged patients with shared initials can still resolve to the correct bedside name.
- Optional `serviceName` support in the patient schema plus service display on ward-map patient cards.
- Convex clinic settings validators plus a tenant-scoped query and upsert mutation for conventions and ward layout data.
- A dedicated `/settings` workspace with General, Conventions, and Ward Map sections, including redirects from the legacy `/dashboard/*` settings routes.
- A dynamic If/Then conventions builder powered by `react-hook-form`, `useFieldArray`, and `sonner` success feedback.
- `@hello-pangea/dnd` plus a Ward Layout Builder that persists room definitions from `/settings/ward-map` into `clinicSettings.wardLayout`.
- A new `/ward-map` board that renders room beds as droppable zones, supports optimistic patient moves, and keeps unmatched assignments in a staging lane.
- A tenant-scoped `updatePatientBed` Convex mutation with audit logging for drag-and-drop bed placement updates.
- A new `/visit` workspace that combines mobile-friendly rounds cards with a print-only A4 visit sheet using Tailwind `print:` modifiers.
- PLG and commercial-layer queries for organization billing visibility, free-tier patient counts, and super-admin tenant oversight.
- A dedicated `/settings/billing` page plus a `/super-admin` commercial dashboard and a rewritten SaaS marketing landing page for WardOS.
- Phase 8 billing infrastructure: Clerk organization webhooks, Iyzico checkout/callback routes, and a server-side Convex mutation bridge for secure subscription updates.
- Phase 10.2 dynamic bed allocation in the patient sheet, deriving selectable beds from the live ward layout while preserving the current patient's occupied bed during edits.

### Changed
- Updated the manual patient sheet to capture full names locally, derive initials on save, and default unassigned admissions into a shared `STAGING` placement lane.
- Updated the patient workflow sheet to require a last-4 identifier and keep browser-local full-name mappings attached to a de-identified identity key instead of the shared staging bed.
- Expanded local roster CSV parsing so imports can reconcile patients by either `bedId` or `initials + identifierCode` without exposing plaintext names to Convex.
- Reworked ward-map labels, toasts, and patient-card interactions so mobile users can tap cards to edit patients and see human-readable room and bed names instead of raw IDs.
- Switched existing patient updates in Convex from `replace()` to `patch()` to reduce accidental overwrites during parallel clinician edits.
- Tightened the settings layout with `min-w-0`, `break-words`, and related text-wrapping fixes to prevent squeezed cards on smaller screens.
- Expanded protected route coverage and dashboard navigation to point at the new clinic settings workspace.
- Updated the legacy `/dashboard/ward-map` route to redirect into the interactive `/ward-map` dashboard surface.
- Updated the dashboard shell so the header and sidebar stay visible on screen but drop out during printing, leaving full-width visit-sheet output.
- Added a soft-lock upgrade banner and read-only PLG enforcement when a non-paying clinic reaches the 50-patient free-trial threshold.
- Moved the 50-patient PLG admission guard into Convex so new patient writes are blocked server-side for non-active organizations, while existing patient edits remain allowed.
- Completed the Phase 10.2 i18n sweep across dashboard, settings, billing, visit, and public entry surfaces, replacing remaining hardcoded UI strings and toasts with `next-intl` messages.
- Updated internal navigation surfaces to rely on the localized `next-intl` `Link`/router helpers so locale-aware client transitions keep Next.js prefetching enabled.

## [0.4.0] - Core clinical workflows
### Added
- `date-fns`-backed clinical day calculations for admission and post-op counters.
- Convex patient query and upsert mutations with tenant isolation plus internal audit log writes.
- A patient census table with local roster name merging, loading skeletons, and row-driven slide-out editing.
- A patient workflow sheet for creating and updating initials-only patient records.

### Changed
- Added the Convex + Clerk React provider to the app shell so dashboard modules can use live Convex queries.
- Introduced a dedicated `/patients` dashboard surface and redirected the legacy `/dashboard` landing route there.
- Extended route protection to include the new patient workflow surface.

## [0.3.0] - Database schema & local PII strategy
### Added
- Convex dependency installation plus a typed `convex/schema.ts` covering organizations, clinic settings, patients, and audit logs.
- Browser-only `useLocalRoster` storage flow for `wardos_local_roster`, keeping `bedId` to full-name mappings off the server.
- A secure CSV import modal for local roster sync using `react-dropzone` and `papaparse`.

### Changed
- Updated the Clerk `proxy.ts` route protection to the explicit protected-route pattern recommended for Next.js 16.
- Expanded the dashboard settings experience to surface the local roster privacy workflow and Phase 3 readiness.

## [0.2.0] - Authentication & tenant architecture
### Added
- Clerk authentication foundation with `ClerkProvider`, protected middleware, and dedicated sign-in and sign-up routes.
- Route-group structure for marketing, auth, dashboard, and provider-admin surfaces.
- Shared dashboard shell with a responsive sidebar, organization switcher, user menu, and theme controls.
- Placeholder tenant pages for the clinic dashboard, ward map, settings, and the provider super-admin area.

## [0.1.0] - Foundation & UI setup
### Added
- Base Shadcn UI primitives for buttons, inputs, cards, dialogs, sheets, menus, tables, badges, labels, and textareas.
- Theme infrastructure with `next-themes`, a shared `ThemeProvider`, and a global `ThemeToggle`.
- Atomic component directories for `atoms`, `molecules`, `organisms`, plus `lib` and `hooks`.
- Initial project brief placeholder for the multi-tenant clinical SaaS foundation.