# Bug Log

## BUG-20260925-001 — PDF actions and single-issue customer reports

**Status:** Fixed
**Severity:** High
**Area:** Frontend / Documents / Customer portal

**Observed Behavior:** PDF controls either had no handler or only displayed a success toast. The customer form stored one category, replaced it on the next selection, and never created a workshop request.

**Cause:** The prototype used presentation-only controls and local form state without a document generator, shared report model or persistence boundary.

**Fix:** Added shared typed document data, `pdf-lib` generation, repeatable issue cards, multiple categories per issue, validation, versioned browser persistence, workshop review status and customer history.

**Evidence:** Lint/build/tests pass; two issues survive refresh and workshop review; four PDFs reopen, match reference values and render cleanly.

## BUG-20261020-002 — Secondary buttons hidden on phones

**Status:** Fixed
**Severity:** High
**Area:** UI

**Observed Behavior:** At 760 px and below, every `.secondary-button` outside page headers and dialogs was hidden, including “Mark complete” in Follow-ups, “Review all issues” and “Open customer” on request cards, and the Settings backup buttons.

**Cause:** The phone media query used `.topbar .eyebrow,.secondary-button { display:none; }`; the second selector was unscoped. The intent was to hide the top-bar portal button, which has a phone replacement.

**Fix:** Phone rule restores `.secondary-button` and hides only `.topbar .secondary-button`.

**Evidence:** “Mark complete” visible at 390 px; no horizontal overflow.

## BUG-20261020-001 — Job detail overflows on phone-width screens

**Status:** Fixed
**Severity:** Medium
**Area:** UI

**Observed Behavior:** At 390 px the JB-JOB-0248 detail page was 664 px wide, forcing horizontal page scroll.

**Cause:** Below 1080 px `.job-layout` uses a `1fr` column; grid items kept `min-width:auto`, so the 650 px sample labour/parts table stretched the column despite its own `overflow-x:auto`. Present before this change.

**Fix:** `.job-main,.job-aside { min-width:0; grid-template-columns:minmax(0,1fr); }` — the table now scrolls inside its panel.

**Evidence:** Page width 371/386 px after fix; table visible width 345 px, scrollable to 650 px.

## BUG-20260925-002 — Remaining inactive prototype actions

**Status:** Resolved 2026-10-20 (implemented or explicitly marked planned)
**Severity:** Medium
**Area:** Frontend

**Resolution (2026-10-20):** Customer add/edit, full job card records, phone requests, stock filters, profile save and contact actions now work against browser-saved records. Payment capture, stock movements/items, supplier and warranty forms, job-card print, photo upload, approval evidence and Excel export are disabled “· planned” controls. Service-record detail buttons and live sharing were removed. A test guards against success messages for unbuilt actions.

**Original audit findings:** Excel export is now visibly disabled as planned work. The following controls still require separately scoped implementation: add/edit customer, create full job card, record phone request, inventory add/movement and stock filters, payment capture, service-record detail, profile save, approval evidence and live sharing/contact actions.

**Recommended Next Step:** Prioritise these actions by owner workflow value after this phase is accepted; do not present them as completed functionality.

Record bugs, symptoms, hypotheses, evidence, and fixes.

## Bug Investigation Template

### Bug ID
BUG-YYYYMMDD-001

### Title
Short bug title.

### Status
Open / Investigating / Fix planned / Fixed / Won't fix

### Severity
Low / Medium / High / Critical

### Area
Frontend / Backend / Auth / Database / Deployment / UI / API / Integration / Other

### Observed Behavior
What actually happened.

### Expected Behavior
What should happen.

### Steps to Reproduce
1. Step one
2. Step two
3. Step three

### Evidence
Error messages, screenshots, logs, file references, test results.

### Suspected Cause
Hypothesis before fixing.

### Related Files
- file path

### Attempt History
Record each fix attempt and result.

### Recommended Next Step
What should happen next.
