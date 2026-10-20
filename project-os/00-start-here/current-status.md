# Current Status

## Summary
Validated interactive frontend prototype (Vinext / React 19 / TypeScript / Tailwind CSS 4). Following the 2026-10-20 project review, the prototype was made honest and internally consistent: actions either work against browser-saved records or are visibly marked planned/sample. It is suitable for owner review; it is not a production workshop system.

Vercel hosting was authorised on 2026-09-25 and a separate Vercel build exists. No live deployment has been verified (see `04-technical/vercel-launch.md`).

## What Works (browser-local — this browser and device only)
- Customers and vehicles: add, edit, archive; odometer edits recorded as readings
- One shared job list across dashboard, table, board, detail and technician views; every job opens its own record
- Persisted job status, QC checklist, road test, inspection checks, notes, findings and activity timeline with time and demo actor; Ready gated on complete QC and a passed road test
- Idempotent conversion of the sample approved estimate into a linked draft job
- Customer portal (fixed demo customer, no sign-in): kilometre updates with regression rejection and service status; service requests; problem reports; profile edits
- Customer Requests inbox: service requests (portal and staff-recorded phone requests) and problem reports with saved statuses, call links and linked job creation
- Follow-up queue with device call/WhatsApp links, explicit completion, audit history, and automatic follow-ups from kilometre updates and service requests
- Versioned storage (v3) with deep validation, v1/v2 migration, refusal to overwrite unreadable data, JSON backup download and back-up-then-reset
- Four sample PDF downloads; cross-tab storage refresh

## What Is Sample or Planned
- Sample (labelled): money, invoices, payments, stock, suppliers, warranties, monthly report figures, service history and the JB-JOB-0248 detail content
- Planned (disabled “· planned” controls): payment capture, stock movements/items, supplier and warranty forms, job-card print, photo uploads, labour/parts line entry, Excel export
- Settings are read-only until the owner confirms business details

## Current Blockers
- Owner review and production scope decision (report priority 1)
- Owner confirmation of telephone, WhatsApp, email, address, VAT, labour rate, service interval/threshold and notification preferences

## Known Risks
- Browser storage is not authentication, shared persistence, backup or access control; records can be cleared or edited by anyone using the browser
- The role selector and customer portal are demonstrations only; they do not isolate data
- Client bundle exceeds 500 kB; Vinext route classification is uncertain — review before production

## Validated (2026-10-20)
- `npm run lint`, `npm run typecheck` (0 errors), `npm test` (typecheck + build + 18 tests) pass
- Browser walkthrough on local dev server: estimate conversion and idempotency, job status/QC gate/notes, technician ↔ staff shared status after reload, portal kilometres/service request/profile, staff inbox, follow-ups, phone request, dialog focus/Escape
- No horizontal overflow at 390 px on dashboard, job detail/table, requests, settings and all portal screens
- No live deployment checked or claimed

## Last Updated
2026-10-20 — Claude Code — Implemented review priority 2 (honest, consistent prototype) and the TypeScript release gate.
