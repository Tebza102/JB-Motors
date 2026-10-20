# Next Action

## Safest Next Actions
1. Jabulani reviews the prototype end to end (staff, technician, customer portal), the four sample PDFs and `output/JB-Motors-project-review-2026-10-20.md`.
2. Confirm workshop contact, address, VAT treatment, labour rate, service interval and reminder threshold, and notification preferences.
3. Agree the minimum paid production scope (review priority 1) and record the architecture decision (stay on Vinext vs standard Next.js App Router; Firebase vs other backend) before backend work.
4. If hosting the demo, complete Vercel authentication and deploy per `04-technical/vercel-launch.md`, then smoke-test the live URL.

## Do Not Do Yet
- Do not add authentication, a database, uploads, payments, email, WhatsApp APIs, GPS, telematics or AI diagnosis until the production scope is approved.
- Do not invent JB Motors contact, tax, address or commercial information.
- Do not use real customer data in the browser-local prototype.
- Do not remove the reference template folder.

## Definition of Done for the Next Phase (secure shared foundation, review priority 3)
- Two staff accounts can access authorised shared records.
- A customer cannot access another customer's records.
- Denied writes are covered by tests.
