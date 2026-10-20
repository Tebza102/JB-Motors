# Change Log

### 2026-10-20 — Built-in guide and phone role switch

**Changed by:** Claude Code

**Files changed:** `app/features/guide/**` (new), `app/page.tsx`, `app/features/customer-portal/CustomerPortal.tsx`, `app/globals.css`, `tests/guide.test.mjs` (new), README and Project OS architecture, test plan and logs.

**Summary:** Added a first-visit welcome and quick tour for staff and customers, a Help panel on every page (page explanation, common or popular tasks, “Ask me how” keyword search with numbered steps and “Take me there”), and a single reusable help library. Unbuilt features answer “Coming soon”. Added the demo role switch and Help to the phone menu so the technician view is reachable on phones. Fixed a pre-existing phone rule that hid every secondary button (including “Mark complete”).

**Tests run:** `npm run lint`, `npm test` (21 tests), `npm run build:vercel` + `npm run verify:vercel`, browser walkthrough of welcome, both tours, help search and phone menu at 390 px.

**Result:** Pass

**Next action:** Owner feedback; compulsory per-user tour after real accounts exist.

### 2026-10-20 — Honest, consistent prototype (project review priority 2)

**Changed by:** Claude Code

**Files changed:**
- `app/page.tsx`, `app/globals.css`, `tsconfig.json`, `worker/index.ts`, `db/cloudflare-workers.d.ts`
- `app/components/ui.tsx`, `app/components/brand.tsx` (identity moved here from `page.tsx`)
- `app/features/workshop-prototype/**` (types, storage v3, `seed.ts`, `jobs.ts`, `service.ts`, `format.ts`, `useModalFocus.ts`, `JobWorkspace.tsx`, dialogs, `contact.ts`)
- `app/features/customer-portal/CustomerPortal.tsx`, `app/features/problem-reports/ProblemReportForm.tsx`
- `tests/workshop-prototype-storage.test.mjs`, `tests/workshop-workflow.test.mjs` (new), `tests/rendered-html.test.mjs`
- `package.json` (scripts only: `typecheck`, `test` now runs it), `.gitignore` (`*.tsbuildinfo`)
- `README.md` and Project OS status, architecture, task board, MVP scope, test plan and logs

**Summary:**
Resolved all 7 standalone TypeScript errors and made typecheck part of `npm test`. Replaced fixed demo job detail with per-job records built from one shared job list; job status, QC, road test, inspection checks, notes and findings persist with timestamps and demo actor, shared between staff and technician views; Ready requires complete QC and a passed road test. Estimate conversion now creates one linked draft (idempotent). Customer kilometres, service requests and profile persist and flow to vehicle records, the requests inbox and the follow-up queue; lower odometer readings are rejected. Staff can record phone requests and create linked job cards from requests. Removed every success message for actions that did not happen; unbuilt actions are disabled “· planned”; money, stock, report and history figures are labelled sample; dashboard, customer and inventory figures are calculated from records. Current date replaces fixed August 2026 headers. Storage v3 validates every record, never overwrites unreadable data, and offers backup download and back-up-then-reset. Customer record dialog now traps focus.

**Tests run:**
- `npm run lint` — pass
- `npm run typecheck` — pass (0 errors; previously 7)
- `npm test` — pass, 18 tests (previously 7)
- Browser walkthrough on local dev server (see current-status)

**Result:** Pass

**Risks remaining:**
- Browser-local only: no authentication, shared database, server validation or backups.
- Bundle size warning and Vinext route classification unchanged.

**Next action:**
- Owner review and production scope decision.

### 2026-09-25 — Vercel deployment preparation

Added a separate Vinext/Nitro Vercel build, pinned adapter dependency, Build Output API configuration, upload exclusions and generated-output verification. Preserved the existing local preview configuration. Resolved Nitro CSS package import resolution with an explicit Tailwind CSS alias. Added generated-output lint exclusions and deployment instructions. No secrets or environment files changed.

Vercel build completes locally. CLI authentication is unavailable, so no live deployment is claimed. Source deployment is required to build native dependencies for Vercel Linux rather than uploading Windows prebuilt dependencies.

### 2026-09-25 — Functional PDFs and multi-issue customer reporting

**Changed by:** Codex

**Files changed:**
- `app/page.tsx`, `app/globals.css`
- `app/features/problem-reports/**`, `app/features/documents/**`
- `package.json`, `package-lock.json`, `tests/**`
- Relevant Project OS status, architecture, quality and log files

**Summary:**
Implemented repeatable multi-issue customer problem reports with multiple categories per issue, validation, versioned browser storage, customer history, workshop review status and confirmed reset. Replaced presentation-only document buttons with direct branded PDFs for estimates, invoices, vehicle history and the August 2026 monthly report.

**Tests run:**
- `npm run lint`, `npm run build`, `npm test`
- Browser validation of multi-issue submission, refresh persistence and workshop status persistence
- All four in-app PDF download controls
- PDF reopen, text/reference/total checks and page-by-page PNG inspection

**Result:** Pass

**Risks remaining:**
- Browser storage is local demo persistence only.
- Media upload, production backend, authentication and integrations remain excluded.
- Other inactive prototype controls are recorded in `BUG-20260925-002`.

**Next action:**
- Owner review, then confirm business details and approve the next production phase.

### 2026-08-20 10:10 — JB Motors canonical frontend prototype completed

**Changed by:** Codex

**Files changed:**
- `app/page.tsx`, `app/globals.css`, `app/layout.tsx`, `vite.config.ts`
- `public/brand/jb-motors-logo.png`
- `project-os/**`
- `.gitignore`
- removed `.openai/hosting.json` and `public/og.png`

**Summary:**
Relocated the validated application and Git history to `C:\Users\appri\JB Motors`; centralised JB Motors identity; used the supplied logo unchanged; corrected the owner and location; removed invented workshop details and retired hosting/social-image metadata; completed workshop, technician and customer UI states including job-card table/board/detail.

**Tests run:**
- `npm ci --ignore-scripts --no-audit --no-fund`
- `npm run lint`
- `npm run build`
- localhost HTTP 200
- desktop, tablet, staff-mobile and customer-mobile browser checks
- role switching, estimate conversion, job QC status, kilometre update, service request and problem report
- source/staged logo SHA-256 comparison

**Result:** Pass

**Risks remaining:**
- Mock data and local state reset on refresh.
- Production contact, commercial and workshop rules require owner confirmation.
- Backend, security, integrations and deployment are not included.

**Next action:**
- Jabulani reviews the local prototype and confirms the pending workshop settings.

Record every meaningful project change.

## Template

### YYYY-MM-DD HH:MM — Change Title

**Changed by:** Human/Agent/Tool

**Files changed:**
- file path

**Summary:**
What changed and why.

**Tests run:**
- test/check

**Result:**
Pass/Fail/Not run

**Risks remaining:**
- risk

**Next action:**
- action

### 2026-05-31 15:30 - Creative Skills Library Upgrade (Frontend + 3D)

**Changed by:** Codex

**Files changed:**
- project-os/09-agent-skills/frontend-design-skill.md
- project-os/09-agent-skills/3d-design-skill.md
- project-os/09-agent-skills/ui-design-skill.md
- project-os/09-agent-skills/graphic-design-skill.md
- project-os/09-agent-skills/reference-art-direction-skill.md
- project-os/09-agent-skills/video-generation-skill.md
- project-os/09-agent-skills/video-editing-skill.md
- project-os/09-agent-skills/digital-stationery-design-skill.md
- TEMPLATE_MANIFEST.json
- README.md

**Summary:**
Added dedicated frontend design and 3D design skills, updated related creative skills to enforce anti-generic output rules and 3D decision flow, and refreshed template manifest and README metadata.

**Tests run:**
- Verified new skill files exist in `project-os/09-agent-skills`
- Verified `TEMPLATE_MANIFEST.json` version and file count
- Verified no source application code files were added or modified

**Result:**
Pass

**Risks remaining:**
- Existing users of previous verbose skill versions may need a quick review to align wording with this updated concise format.

**Next action:**
- Run a simulated prompt set against the updated skills to validate instruction quality and coverage.

### 2026-05-31 16:05 - Skills Library Upgrade v1.4 (Video-To-Website)

**Changed by:** Codex

**Files changed:**
- project-os/09-agent-skills/video-to-website-skill.md
- project-os/09-agent-skills/frontend-design-skill.md
- project-os/09-agent-skills/video-generation-skill.md
- project-os/09-agent-skills/video-editing-skill.md
- project-os/09-agent-skills/3d-design-skill.md
- project-os/09-agent-skills/reference-art-direction-skill.md
- TEMPLATE_MANIFEST.json
- README.md

**Summary:**
Added a dedicated video-to-website skill for scroll-driven canvas storytelling workflows and cross-referenced it across frontend, video, 3D, and reference skills. Updated template version metadata to v1.4.

**Tests run:**
- Verified new skill file creation
- Verified cross-reference insertion in targeted skill files
- Verified manifest version/file count
- Verified documentation-only scope

**Result:**
Pass

**Risks remaining:**
- `project-os/10-prompts/master-codex-operating-prompt.md` was requested for update in source instructions but does not exist in this template.

**Next action:**
- Add the missing master operating prompt file to `project-os/10-prompts` if future prompt-level integration is required.

### 2026-06-01 10:40 - Skills Library Upgrade v1.5 (Branded Assets + Export Reliability)

**Changed by:** Codex

**Files changed:**
- project-os/09-agent-skills/pdf-document-export-skill.md
- project-os/09-agent-skills/brand-asset-generation-skill.md
- project-os/09-agent-skills/visual-export-qa-skill.md
- project-os/09-agent-skills/controlled-fix-guardrail-skill.md
- project-os/09-agent-skills/website-visual-intelligence-skill.md
- project-os/09-agent-skills/web-research-content-harvesting-skill.md
- project-os/09-agent-skills/document-intelligence-simplification-skill.md
- project-os/09-agent-skills/content-packaging-repurposing-skill.md
- project-os/09-agent-skills/source-governance-quality-skill.md
- project-os/09-agent-skills/digital-stationery-design-skill.md
- project-os/09-agent-skills/graphic-design-skill.md
- project-os/09-agent-skills/reference-art-direction-skill.md
- project-os/09-agent-skills/qa-testing-skill.md
- project-os/09-agent-skills/business-analysis-skill.md
- TEMPLATE_MANIFEST.json
- README.md

**Summary:**
Added nine new skills for website-based brand extraction, document simplification, content repurposing, source governance, controlled fix boundaries, and robust PDF/export QA. Updated key existing skills with cross-skill triggers and branded-asset rules.

**Tests run:**
- verified new skill files exist
- verified updated skills include required cross-references
- verified manifest version and file count
- verified documentation-only scope

**Result:**
Pass

**Risks remaining:**
- `AGENTS.md` not found in template path, so requested section could not be appended.

**Next action:**
- add `AGENTS.md` at repository root and append branded-asset/export rules section.
