# Decision Log

Record important decisions so future agents understand why things were done.

## Template

### YYYY-MM-DD — Decision Title

**Decision:** What was decided.

**Reason:** Why it was decided.

**Alternatives Considered:** What else was considered.

**Impact:** What this affects.

**Owner:** Human or agent responsible.

### 2026-10-20 — Implement review priority 2 only; label rather than fake

**Decision:** Implement the 2026-10-20 review's “honest, consistent prototype” priority and the TypeScript gate. Do not start authentication, a database or payments: those depend on the owner's scope and architecture decision (review priority 1). Unbuilt actions are shown disabled as “· planned”; sample figures are labelled; success text describes only what happened.

**Reason:** The review and Project OS both gate backend work on owner approval, and misleading success states were the main demo risk.

**Alternatives Considered:** Building payment/supplier/warranty forms in browser storage (rejected: would deepen local-only workflows due to be replaced); hiding unbuilt controls (rejected: owner should see intended scope).

**Impact:** Prototype is reviewable without misrepresenting capability. Browser storage moved to v3 with a never-overwrite rule and backup/reset as the prototype's recovery design.

**Owner:** Implemented by Claude Code; scope decision remains with Jabulani.

### 2026-08-20 — Canonical local prototype and source boundary

**Decision:** Use `C:\Users\appri\JB Motors` as the canonical project, retain the generated workspace as rollback, preserve `ai-project-os-template` as an ignored reference, and keep this phase local-only.

**Reason:** Jabulani requested a complete owner-reviewable frontend without backend, upload, external publication or deployment risk.

**Alternatives Considered:** Continue from the generated workspace; reuse the empty private Sites shell; add Firebase immediately.

**Impact:** The supplied logo is the only logo asset; unconfirmed workshop facts stay pending; all interactions use mock session state.

**Owner:** Jabulani; implemented by Codex.
