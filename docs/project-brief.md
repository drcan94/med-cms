# Clinical Management SaaS Project Brief

## Overview
A multi-tenant B2B clinical management SaaS for clinics, wards, and surgical teams. The platform is intended to provide a shared product foundation with tenant-specific workflows, ward layouts, and operational rules.

## Core Goals
- Support provider-level administration plus clinic-level ownership and staff roles.
- Deliver a clean, fast clinical UI that can scale from MVP workflows to enterprise modules.
- Keep the design system consistent through Next.js, Tailwind CSS, and Shadcn UI primitives.

## Privacy Boundary
- Full patient names stay on the client only through local-first browser mapping.
- Backend records must remain de-identified and store initials instead of plain-text names.
- The server should never become a source of recoverable patient identity data.

## Phase 1 Scope
- Establish the shared UI foundation, theming, and atomic component structure.
- Prepare the codebase for future Clerk, Convex, and tenant-aware clinical workflows.
- Keep documentation lightweight while the product architecture is still evolving.