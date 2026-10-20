# Architecture

## Project Structure
- `app/page.tsx`: staff screens and state orchestration
- `app/components/`: shared UI (`ui.tsx`: status pill, page header, metric card, planned button) and confirmed identity (`brand.tsx`: `WORKSHOP_PROFILE`, logo lockup)
- `app/features/workshop-prototype/`: record types, seed data (`seed.ts`), job workflow rules (`jobs.ts`), service/odometer/request rules (`service.ts`), formatting, versioned storage, dialogs and the job/technician workspaces
- `app/features/customer-portal/`: customer portal screens
- `app/features/problem-reports/`: report types, repeatable issue form and versioned browser persistence
- `app/features/documents/`: shared sample document data and client-side PDF generation
- `public/brand/`: authoritative JB Motors logo
- `tests/`: Node tests (storage, workflow rules, PDFs, contact links, rendered HTML, misleading-copy guard)
- `db/`, `drizzle/`, `worker/`, `examples/`: Cloudflare/Drizzle starter scaffolding; not workshop persistence
- `.openai/hosting.json`: absent (retired Sites hosting)

## Frontend
Vinext-compatible Next.js App Router shape, React 19, TypeScript, Tailwind CSS 4. Not a conventional production Next.js deployment. Workflow rules are pure functions in feature modules so they can be tested without a browser.

## Data model (browser-local prototype)
Seeded sample records live in `seed.ts`. Local changes are stored as records or field-level overlays keyed by id (customers, follow-ups, service requests, job progress). One job list is built from seeded jobs + local drafts + the progress overlay and used by every job screen. Money in sample invoices and stock uses integer cents.

## Backend
None. No API routes, server validation, queues, notifications or background jobs.

## Database
None active. Drizzle scaffolding does not commit the project to SQL/D1.

## Authentication and Authorization
None. The “Demo role” selector changes the screens shown; it is not a security boundary. The customer portal always shows the demo customer.

## Storage
- Workshop records: `localStorage` key `jb-motors-workshop-prototype`, envelope version 3; v1/v2 migrate on load.
- Every record is validated on load and before save. If stored data is unreadable, it is not loaded and saves are refused; Settings → Local demo data copies it to `jb-motors-workshop-prototype.backup.<timestamp>` before resetting, and can download a JSON backup.
- Problem reports: separate versioned key with the same never-overwrite rule.
- Writes succeed before the UI confirms. A `storage` event listener reloads data changed in another tab.
- No cloud file storage; photo/video upload is unavailable.

## Documents
`pdf-lib` generates sample estimate, invoice, vehicle-history and August 2026 report downloads. Values come from shared typed sample data, not from records created in the app.

## Deployment
Vercel hosting authorised 2026-09-25. `npm run build:vercel` + `npm run verify:vercel` produce and check Build Output API v3 output; see `vercel-launch.md`. Live status must be verified separately.

## Release gate
`npm test` runs `tsc --noEmit`, the production build and all Node tests. `npm run lint` must also pass.

## External Integrations
No APIs. Follow-ups and request cards open the device's telephone handler (`tel:`) and WhatsApp (`wa.me` link with a drafted message). Opening a handler is recorded as “opened”, not as completed contact.

## Key Risks
- Mock and local records could be mistaken for shared production data; keep sample/planned labelling visible.
- Role switching could be mistaken for security.
- `app/page.tsx` remains large; continue splitting by domain before backend work.
- Client bundle >500 kB and uncertain Vinext route classification need review before production.

## Agent Notes
Search `app/page.tsx`, `app/components/` and `app/features/` before adding UI. Put workflow rules in pure feature modules with tests. Read Project OS required files before source edits.
