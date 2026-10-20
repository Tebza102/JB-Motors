# Test Plan

## Test Strategy
Validate structure first, then compile, then exercise representative role and workflow interactions, and finally inspect responsive layouts. Do not accept visual polish if navigation or workflow states are incomplete.

## Manual Tests
- Owner dashboard and every sidebar destination
- Role switching for Owner, Service Advisor, Technician, Store / Parts, and Finance
- Customer and vehicle search plus detail transitions
- Vehicle overview, service history, kilometre history, and service status
- Estimate list/detail and conversion confirmation
- Job-card table, board, detail, status, technician notes, parts, and QC
- Inventory, supplier, stock movement, invoice, payment, receipt, warranty, request, follow-up, reports, and settings
- Customer kilometre update, service request, problem report, history, and profile
- Loading, empty, error, confirmation, and success demo states

## Automated Tests
- `npm run lint`
- `npm test` = `npm run typecheck` + production build + `node --test tests/*.test.mjs`
- `tests/workshop-prototype-storage.test.mjs`: v3 envelope, v1/v2 migration, malformed data never overwritten, backup and reset
- `tests/workshop-workflow.test.mjs`: shared job list, status/QC gate, notes, idempotent estimate conversion, odometer regression and follow-up rule, service request validation and references
- `tests/rendered-html.test.mjs`: server-rendered dashboard, centralised identity, retired Sites hosting config absent (does not check Vercel), and a guard against success messages for unbuilt actions
- `tests/guide.test.mjs`: every screen has a page guide, “Ask me how” returns the right topic for plain-language questions (unbuilt features return “coming soon”), and every quoted button/label in available instructions exists in the app
- `tests/problem-report-storage.test.mjs`, `tests/pdf-generation.test.mjs`, `tests/contact-actions.test.mjs`
- HTTP 200 check against the local development server

## Responsive Tests
- Desktop: approximately 1440 × 900
- Tablet: approximately 1024 × 768
- Staff mobile: approximately 390 × 844
- Customer mobile: approximately 390 × 844

## Regression Tests
- Logo aspect ratio and white brand rail
- No horizontal overflow in primary mobile views
- Keyboard focus remains visible
- Tables transform into usable mobile records
- Sticky job status and mobile navigation do not cover content
- Prototype state survives interactions without runtime errors

## Test Data
Use only fictional South African customer, vehicle, job, estimate, invoice, and payment records. Business identity must use confirmed JB Motors facts only.

## Acceptance Criteria
- Exact logo appears in every brand placement.
- Jabulani and Ratanda, Heidelberg, Gauteng appear correctly.
- No fake JB Motors phone, email, address, VAT, or commercial rules remain.
- All planned UI modules and states are demonstrable.
- Lint and build pass from the canonical path.
- No success message describes an action that did not happen.
- Deployment status is only claimed after checking the live URL.
