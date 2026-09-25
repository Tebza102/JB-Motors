# Change Log

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
