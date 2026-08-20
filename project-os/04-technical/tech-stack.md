# Tech Stack

## Frontend Stack
- Framework: Vinext-compatible Next.js App Router
- Language: TypeScript
- UI runtime: React 19
- Build tool: Vite through Vinext
- Styling: Tailwind CSS 4 plus project-specific global CSS
- Typography: Geist Sans and Geist Mono
- Forms: native controlled and uncontrolled React forms for prototype interactions
- Charts: CSS-based lightweight visualisations
- PDF/export: document-ready layouts only; no live export service

## Backend Stack
- Runtime: Cloudflare-compatible ESM build target supplied by the starter
- API framework: none active
- Serverless/functions: none active
- Database SDK: Drizzle scaffolding present but unused
- Auth SDK: none

## Database and Storage
- Database: none active
- Storage: none active
- Realtime: none

## Deployment
- Current mode: local-only
- Build command: `npm run build`
- Development command: `npm run dev`
- Output folder: `dist/`
- Node requirement: 22.13 or later

## AI/Automation Tools
None inside the product. AI troubleshooting is a parked future capability and must not appear active.

## Package Management
- Package manager: npm
- Lockfile: `package-lock.json`
- Monorepo/workspaces: no

## Stack Decisions
The current stack supports a fast, responsive prototype and Cloudflare-compatible build without adding backend scope. Production persistence, auth, forms, exports, and integrations require a separately approved architecture phase.
