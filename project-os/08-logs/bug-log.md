# Bug Log

## BUG-20260925-001 — PDF actions and single-issue customer reports

**Status:** Fixed
**Severity:** High
**Area:** Frontend / Documents / Customer portal

**Observed Behavior:** PDF controls either had no handler or only displayed a success toast. The customer form stored one category, replaced it on the next selection, and never created a workshop request.

**Cause:** The prototype used presentation-only controls and local form state without a document generator, shared report model or persistence boundary.

**Fix:** Added shared typed document data, `pdf-lib` generation, repeatable issue cards, multiple categories per issue, validation, versioned browser persistence, workshop review status and customer history.

**Evidence:** Lint/build/tests pass; two issues survive refresh and workshop review; four PDFs reopen, match reference values and render cleanly.

## BUG-20260925-002 — Remaining inactive prototype actions

**Status:** Open / backlog
**Severity:** Medium
**Area:** Frontend

**Audit Findings:** Excel export is now visibly disabled as planned work. The following controls still require separately scoped implementation: add/edit customer, create full job card, record phone request, inventory add/movement and stock filters, payment capture, service-record detail, profile save, approval evidence and live sharing/contact actions.

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
