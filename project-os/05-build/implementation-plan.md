# Implementation Plan

## Current Feature or Fix
Canonical local relocation, exact JB Motors branding, identity correction, and complete interactive UI prototype.

## Reason for Work
The initial prototype was created in a generated workspace, used a temporary text lockup and demo owner/contact information, and left several secondary modules at generic list depth. Jabulani approved the complete local-only UI plan.

## Files to Inspect First
- `app/page.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `project-os/00-start-here/current-status.md`
- `project-os/03-design/brand-rules.md`
- `project-os/07-agent-control/agent-rules.md`

## Files Likely to Change
- `app/page.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `.gitignore`
- `public/brand/jb-motors-logo.png`
- Relevant Project OS documentation and logs

## Implementation Steps
1. Work in a staged copy and preserve the original generated workspace.
2. Install and initialize root Project OS.
3. Centralize confirmed workshop identity in a typed configuration.
4. Replace temporary logo treatments with the exact supplied image.
5. Remove generated social artwork and image metadata.
6. Replace fake workshop contact, address, VAT, and commercial details with owner-confirmation states.
7. Complete list/detail views, job table/board/detail, settings sections, stock/payment/receipt details, and reusable demo states.
8. Validate lint, build, interactions, and responsive layouts.
9. Copy the validated source and Git history to `C:\Users\appri\JB Motors`, install dependencies, and re-run final checks.

## Risks
- Logo source access may require permission; copy the exact file without editing.
- Destination already contains a template folder; preserve and ignore it rather than overwriting.
- Current source is intentionally dense; avoid unrelated architectural refactors.
- Prototype actions may appear live; keep prototype cues and local confirmations clear.

## Tests Required
- `npm run lint`
- `npm run build`
- Local HTTP response
- Desktop, tablet, staff-mobile, and customer-mobile visual checks
- Navigation, role, status, filter, service, kilometre, problem-report, estimate, invoice, payment, and follow-up interactions
- Identity/content scan for forbidden demo business facts

## Rollback Plan
The original generated workspace remains unchanged. If validation fails, remove only the staged/canonical copy and restart from the original validated source.

## Approval Status
Plan approved by the user on 2026-08-20. Local implementation authorised. Source upload and deployment not authorised.
