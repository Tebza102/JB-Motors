# Decision Log

Record important decisions so future agents understand why things were done.

## Template

### YYYY-MM-DD — Decision Title

**Decision:** What was decided.

**Reason:** Why it was decided.

**Alternatives Considered:** What else was considered.

**Impact:** What this affects.

**Owner:** Human or agent responsible.

### 2026-08-20 — Canonical local prototype and source boundary

**Decision:** Use `C:\Users\appri\JB Motors` as the canonical project, retain the generated workspace as rollback, preserve `ai-project-os-template` as an ignored reference, and keep this phase local-only.

**Reason:** Jabulani requested a complete owner-reviewable frontend without backend, upload, external publication or deployment risk.

**Alternatives Considered:** Continue from the generated workspace; reuse the empty private Sites shell; add Firebase immediately.

**Impact:** The supplied logo is the only logo asset; unconfirmed workshop facts stay pending; all interactions use mock session state.

**Owner:** Jabulani; implemented by Codex.
