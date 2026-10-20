# Deployment Log

Record deployment attempts and outcomes.

## Template

### YYYY-MM-DD HH:MM — Deployment Attempt

**Platform:** Vercel/Firebase/Netlify/Render/Railway/Other

**Branch:** branch name

**Commit:** commit hash if available

**Result:** Success/Failed

**Build Command:** command

**Errors:** error summary

**Environment Variables Checked:** Yes/No

**Live URL:** URL if relevant

**Post-Deployment Tests:**
- test result

**Next Action:**
- action

### 2026-08-20 10:00 — Local-only validation

**Platform:** Localhost only

**Branch:** main

**Result:** No deployment attempted by design

**Build Command:** `npm run build`

**Errors:** None

**Environment Variables Checked:** Not applicable; no production integrations are active

**Live URL:** None

**Post-Deployment Tests:** Local responsive and interaction checks only

**Next Action:** Owner review from the canonical local project.

### 2026-10-20 10:22 SAST — Production deployment of the honest, consistent prototype

**Platform:** Vercel (Git integration with GitHub `Tebza102/JB-Motors`; pushes to `main` deploy to Production)

**Branch:** main

**Commit:** d5e105a

**Result:** Success (GitHub deployment status `success`, Vercel commit check “Deployment has completed”)

**Build Command:** `npm ci` then `npm run build:vercel` (from `vercel.json`; first production build using the Vinext/Nitro Vercel configuration — earlier commits did not include it)

**Errors:** None. A local `EBUSY` file lock during `npm run build:vercel` was cleared by deleting the generated `.vercel/output` and rebuilding.

**Environment Variables Checked:** No new variables required; none changed.

**Live URL:** Production alias `https://jb-motors-apprigate.vercel.app` (protected by Vercel Authentication; deployment `https://jb-motors-hvm44kuk7-apprigate.vercel.app`). Note: `https://jb-motors.vercel.app` is not this project.

**Pre-Deployment Tests:** `npm run lint`, `npm test` (typecheck + build + 18 tests), `npm run build:vercel`, `npm run verify:vercel` (HTTP 200, dashboard, 8 assets, logo), image route served.

**Post-Deployment Tests:** Signed-in browser check of the production alias: new dashboard (live date, “Demo role”, computed KPIs), per-job detail, job table filter, estimate conversion action, planned payment action, demo-labelled customer portal, logo loads, no console errors on load. No records were created in production browsers.

