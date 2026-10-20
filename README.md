# JB Motors — Digital Workshop prototype

An interactive, browser-local prototype of a single-workshop management and customer-retention platform for JB Motors (Ratanda, Heidelberg, Gauteng). It shows staff, technician and customer experiences so the owner can review the product before any production build.

**This is not a production system.** There is no database, server API, sign-in, access control, cloud file storage, payment processing or message delivery. Records you create are saved only in the current browser. Use synthetic data only.

## Prerequisites

- Node.js `>=22.13.0` (Node 24 is used for verification; tests import TypeScript directly through Node's type stripping)

## Commands

```bash
npm install
npm run dev            # local development server (Vinext / Vite)
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm test               # release gate: typecheck + production build + node --test tests/*.test.mjs
npm run build:vercel   # separate Vinext/Nitro build for Vercel (Build Output API v3)
npm run verify:vercel  # checks the generated Vercel output responds and references real assets
```

`npm test` must pass before any release. Deployment steps and the current hosting status are in `project-os/04-technical/vercel-launch.md`; a successful local build does not mean a deployment is live.

## What works (saved in this browser)

- Customers and vehicles: add, edit, archive; odometer edits create reading history.
- Job cards: one job list shared by the dashboard, table, board, detail and technician views. Every job opens its own record. Status changes, QC checks, road test, inspection checks, notes and findings are saved with time and demo actor. **Ready** requires every QC check and a passed road test.
- Estimate conversion: the sample approved estimate (JB-EST-0226) converts once into a linked draft job; converting again opens the same job.
- Customer portal (demo customer Thabo Mokoena, no sign-in): kilometre updates (lower readings rejected) update service status, the vehicle record and the follow-up queue; service requests and problem reports appear in the staff inbox; profile edits update the customer record.
- Customer Requests: service requests (portal or recorded phone requests) and problem reports with saved statuses, call links, and "Create job card" linked back to the request.
- Follow-ups: call / WhatsApp device links, explicit completion and audit history. Opening a link does not prove contact happened.
- PDFs: sample estimate, invoice, service-history and monthly-report downloads (pdf-lib).
- Built-in guide: a welcome and quick tour on first visit (staff and customer), “Help” on every page with a short page explanation, and “Ask me how” search with step-by-step instructions and “Take me there”. Unbuilt features answer “Coming soon”. All guide text lives in `app/features/guide/content.ts` so the production app can reuse it as the training manual.
- On phones, the menu includes the demo role switch and Help.
- Settings → Local demo data: download a JSON backup, or back up and reset local workshop records. Unreadable saved data is never overwritten; it must be backed up and reset first.

## Deliberately not built (shown as "· planned" or labelled sample)

Payments capture and receipts, stock movements and purchasing, supplier and warranty forms, job-card printing, photo uploads, invoice generation from jobs, editable settings, and report calculations. Money, stock, report and service-history figures are labelled sample data.

## Project structure

| Path | Purpose |
|---|---|
| `app/page.tsx` | Staff screens and state orchestration |
| `app/components/` | Shared UI (`ui.tsx`) and the confirmed workshop identity (`brand.tsx`) |
| `app/features/workshop-prototype/` | Record types, seed data, job/service workflow rules, versioned storage, dialogs, job and technician workspaces |
| `app/features/customer-portal/` | Customer portal screens |
| `app/features/problem-reports/` | Multi-issue problem reports and their storage |
| `app/features/guide/` | Help library (page guides, how-to topics, tours), search, help panel, welcome and tour |
| `app/features/documents/` | Sample document data and PDF generation |
| `tests/` | Node tests: storage, workflow rules, PDFs, contact links, rendered HTML, copy guards |
| `db/`, `drizzle/`, `worker/`, `examples/` | Unused Cloudflare/Drizzle starter scaffolding — not workshop persistence |
| `project-os/` | Business, product, technical, quality and delivery records |

## Before production

Owner confirmation of business details (contact, VAT, labour rate, service rules) and an approved production scope are required first. The production foundation (authentication, enforced roles, shared database, audit, backups) is described in `project-os/04-technical/architecture.md` and the 2026-10-20 project review.
