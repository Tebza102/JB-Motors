# Vercel launch

The owner authorised Vercel hosting on 2026-09-25. This supersedes the earlier local-only deployment restriction. Backend, authentication and integrations remain outside this change.

## Configuration

- Existing project: `apprigate/jb-motors`, linked by `.vercel/project.json`.
- `vite.vercel.config.ts` uses Vinext and pinned Nitro with the Vercel preset.
- `vercel.json` overrides framework detection and runs `npm run build:vercel`.
- Output is Vercel Build Output API v3: `.vercel/output/config.json`, server function and static assets.
- The existing `vite.config.ts` remains the local preview/build configuration.
- `.vercelignore` excludes local reports, project notes, test artifacts and environment files from uploads.

## Validation and launch

Run from `C:\Users\appri\JB Motors`:

```powershell
npm run build:vercel
npm run verify:vercel
npm run lint
npm test
npx --yes vercel@60.0.1 login
npx --yes vercel@60.0.1 deploy --prod --yes --scope apprigate
```

Deploy source so Vercel rebuilds native dependencies for Linux; do not upload Windows-built native modules using `--prebuilt`.

After deployment reaches Ready, check the production URL, logo/CSS, customer navigation, PDF downloads and report persistence. Do not claim the site is live based on a local build alone.

## How production deploys

The Vercel project is connected to GitHub `Tebza102/JB-Motors`: every push to `main` creates a Production deployment (no CLI login needed). Run the validation commands above before pushing, then confirm the GitHub deployment status for the pushed commit and check the live alias.

Production alias: `https://jb-motors-apprigate.vercel.app` (Vercel Authentication enabled — only signed-in team members can view it). `https://jb-motors.vercel.app` belongs to a different project.

## Current status (2026-10-20)

Commit `d5e105a` is deployed to Production and verified; see `08-logs/deployment-log.md`. The Vercel CLI is still logged out and the Vercel connector lacks access to the `apprigate` scope, so dashboard-level checks (logs, settings) need a team member.

## Product limits

This launch hosts the demo. Role switching is not authentication; reports remain browser-local. No workshop backend, cloud uploads or real payment processing is introduced.
