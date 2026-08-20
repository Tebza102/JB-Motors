# Architecture

## Project Structure
- `app/`: App Router layout, global styling, and the interactive prototype surface
- `public/brand/`: authoritative JB Motors logo
- `tests/`: rendered HTML validation
- `db/`, `drizzle/`, `worker/`, and `examples/`: starter capability scaffolding; not active in this prototype
- `project-os/`: business, product, design, technical, quality, governance, and agent controls
- `.openai/hosting.json`: retained Sites metadata; deployment is explicitly disabled for this phase

## Frontend
Vinext-compatible Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Geist typography, and client-side React state. The product currently uses one coherent application entry point with reusable internal view components and typed view/role/state unions.

## Backend
No active backend, API routes, queues, notifications, or background jobs. Prototype actions change local component state only.

## Database
No active database. Starter Drizzle scaffolding is unused and must not be presented as persistent workshop data.

## Authentication and Authorization
No production authentication. The role selector demonstrates information architecture only; it is not a security boundary.

## Storage
No active file storage. Image and video inputs are interface demonstrations and do not upload.

## Deployment
Local-only. Development command: `npm run dev`. Validation command: `npm run build`. No source upload or deployment without explicit owner approval.

## External Integrations
None active. Telephone, WhatsApp, email, payment, GPS, telematics, and AI integrations are excluded.

## Key Risks
- Users could mistake mock records for persisted data if the prototype boundary is hidden.
- Role switching could be mistaken for security.
- Starter persistence folders could mislead future agents.
- The large single page should be modularised before production backend work, but not during this visual prototype unless separately approved.

## Agent Notes
Search `app/page.tsx` and `app/globals.css` before adding UI. Extend existing patterns rather than creating duplicate components. Read Project OS required files before source edits.
