# WorldWeaver UI — Current State (September 2025)

This document reflects the current, running state of the application and how to work with it. It supersedes older docs in the repo for setup and usage.

## Overview
- Next.js App Router app with Supabase for auth, database, and storage
- Fully authenticated API routes with server middleware (CSP nonces, headers, rate limiting)
- Core domain: Worlds, Folders, Templates, Entities, Relationships, Members, Invites
- Modern UI with virtualized grids and skeleton loaders for large datasets

## Requirements
- Node 18+ (Node 20/22 recommended)
- npm (repo uses `package-lock.json`)
- Supabase project (URL + keys)

## Setup
1) Install dependencies
```
npm install
```

2) Configure environment
- Copy `.env.local.example` to `.env.local` and fill values, or set the following:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
# Required for server/admin utilities (seeding, scripts)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3) Run the app
```
# Dev
npm run dev

# Production build
npm run build
npm start
```

4) Lint and tests
```
npm run lint
npm test
```

## Scripts
- `dev`: Next.js dev server (with patch for fs.readlink on Windows)
- `build`, `start`: Production build and start
- `lint`: ESLint (Next config)
- `test`: Vitest (minimal at present)
- `seed:core`: Seed core templates into the database via API/admin script
- `test:api`, `test:mcp`: Utility test scripts (optional)

## Environment
- Browser client: `src/lib/supabase/browser.ts`
- Server client: `src/lib/supabase/server.ts`
- Admin client (service role): `src/lib/supabase/admin.ts`
- Generated DB types: `src/lib/supabase/types.generated.ts` (re-exported by `src/lib/supabase/types.ts`)

## Data & Migrations
- SQL migrations live in `supabase/migrations/`
- Apply migrations using Supabase SQL editor, Supabase CLI, or psql
- Example (psql):
```
psql "$SUPABASE_DB_OWNER_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/<timestamp>_migration.sql
```

## Middleware & Security
- `middleware.ts`
  - Security headers (HSTS, XFO, Referrer-Policy, etc.)
  - CSP with per-request nonces for scripts and styles
  - Rate limiting via `src/lib/rate-limiting.ts` (KV if available, memory fallback)
- Input sanitization: `src/lib/security.ts` (DOMPurify on client, safe fallbacks on server)

## API Endpoints (authenticated)
Base path: `/api`
- Worlds
  - `GET /api/worlds` — list user worlds
  - `POST /api/worlds` — create world
  - `GET/PUT/DELETE /api/worlds/[id]` — world by id
  - `GET/POST /api/worlds/[id]/entities`
  - `GET/POST /api/worlds/[id]/folders`
  - `GET/POST /api/worlds/[id]/templates`
  - `GET/POST /api/worlds/[id]/relationships`
  - `GET /api/worlds/[id]/members`
  - Invites: `GET/POST /api/worlds/[id]/invites`, `DELETE /api/worlds/[id]/invites/[inviteId]`, and `POST /api/invites/accept`
  - Files: `POST /api/worlds/[id]/files/upload`
- Entities/Templates/Folders by id
  - `GET/PUT/DELETE /api/entities/[id]`
  - `GET/PUT/DELETE /api/templates/[id]`
  - `GET/PUT/DELETE /api/folders/[id]`
- Admin
  - `POST /api/admin/seed-core-templates`
- Health
  - `GET /api/health/db` — DB connectivity/latency check

## Frontend Pages
- `/` — Dashboard / Worlds
- `/world/[id]` — World detail view
- `/health` — Health status UI polling `/api/health/db`

## UI Components & Patterns
- Virtualized grids and skeleton loaders for Worlds, Entities, Templates (see `src/components/**/Virtual*Grid.tsx` and `src/components/**/*Skeleton.tsx`)
- Reusable UI primitives in `src/components/ui/` (Accordion, Alert, Badge, Button, Card, FormField, Input, Skeleton, SmartGrid, Tooltip, VirtualGrid)

## Storage & Uploads
- File metadata table + Supabase Storage integration
- Upload route: `POST /api/worlds/[id]/files/upload`
- Security helpers under `src/lib/security/fileUpload.ts`

## Project Structure (selected)
```
src/
  app/
    api/                      # Authenticated API routes
    health/page.tsx           # Health dashboard
    world/[id]/page.tsx       # World detail page
  components/
    ui/                       # Reusable UI components
    worlds/, entities/, ...   # Feature components
  lib/
    supabase/                 # Supabase clients & types
    services/                 # Domain services
    security.ts               # Sanitization helpers
    rate-limiting.ts          # Rate limiting service
    logging.ts                # Error logging helpers
  styles/tokens.css           # Design tokens
supabase/
  migrations/                 # SQL migrations
```

## Troubleshooting
- Auth failures: ensure `NEXT_PUBLIC_SUPABASE_*` keys are set and valid
- Admin/seed scripts: require `SUPABASE_SERVICE_ROLE_KEY`
- CSP issues in dev: HMR requires relaxed inline policies; production uses nonces
- Windows: repo includes a small patch loader for Next.js in scripts (`scripts/patch-fs-readlink.cjs`)

## License & Support
- Private project; no license file present
- Open issues and discussions on the repository as needed

