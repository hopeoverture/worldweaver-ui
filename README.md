# WorldWeaver UI — Current State (September 2025)

This document reflects the current, running state of the application and how to work with it. It supersedes older docs in the repo for setup and usage.

## Overview
- **Next.js 15.5.2** App Router with **React 19.1.0**
- **Supabase** for auth, database, and storage with SSR support
- **Tailwind CSS 4.1.13** for styling (no PostCSS config needed)
- Fully authenticated API routes with server middleware (CSP nonces, headers, rate limiting)
- Core domain: Worlds, Folders, Templates, Entities, Relationships, Members, Invites
- Modern UI with virtualized grids, skeleton loaders, and error boundaries for large datasets
- TypeScript with strict mode and Zod validation

## Requirements
- **Node 20/22** (Node 18+ minimum)
- **npm** (repo uses `package-lock.json`)
- **Supabase project** with database, auth, and storage enabled
- Environment variables (see setup below)

## Setup
1) Install dependencies
```
npm install
```

2) Configure environment
Create `.env.local` with the following required variables:
```bash
# Required - Supabase public configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Required - Service role for admin operations and seeding
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional - Development and seeding configuration
SEED_ADMIN_TOKEN=your-random-secret-for-seeding
SEED_BASE_URL=http://localhost:3000
ADMIN_SEED_ENABLED=false
```

3) Apply database migrations
```bash
# Using Supabase CLI
npx supabase db push

# Or using psql directly
psql "$SUPABASE_DB_URL" -f supabase/migrations/*.sql
```

4) Run the application
```bash
# Development server (includes Windows Node.js fs.readlink patch)
npm run dev

# Production build and start
npm run build
npm run start

# Seed core system templates (optional)
npm run seed:core
```

5) Development tools
```bash
# Linting and testing
npm run lint
npm run test
npm run test:api

# Type checking
npm run typecheck

# MCP server testing (optional)
npm run test:mcp
```

## Key Technologies

### Frontend
- **Next.js 15.5.2** with App Router and React 19.1.0
- **Tailwind CSS 4.1.13** with CSS variables for theming
- **TypeScript** with strict mode enabled
- **Zod** for runtime validation and type safety
- **TanStack Query** for server state management
- **Zustand** for client-side state management

### Backend & Database
- **Supabase** for authentication, database, and file storage
- **PostgreSQL** with Row Level Security (RLS) policies
- **Server-side rendering** with authentication middleware
- **JSONB fields** for flexible custom data storage

### Development & Deployment
- **Vitest** for testing with API endpoint validation
- **ESLint** with Next.js configuration
- **Vercel** deployment with automatic builds
- **Windows compatibility** via fs.readlink patch

## Available Scripts
- `npm run dev` - Development server with HMR and Windows patch
- `npm run build` - Production build with optimization
- `npm run start` - Start production server
- `npm run lint` - ESLint code analysis
- `npm run test` - Run Vitest test suite
- `npm run test:api` - Test API endpoints
- `npm run seed:core` - Seed system templates via admin API
- `npm run test:mcp` - Test MCP server configuration

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

## Recent Updates & Fixes

### September 2025
- **PostCSS Configuration Fix**: Fixed PostCSS config for Tailwind CSS v4 using `@tailwindcss/postcss` plugin, resolving Vercel build failures
- **Field Consistency Audit**: Completed comprehensive database field naming consistency review
- **Authentication & World Loading**: Fixed SSR initialization issues and authentication context problems
- **Database Optimizations**: Added performance monitoring views and composite indexes for common query patterns

## Troubleshooting

### Common Issues
- **Auth failures**: Ensure `NEXT_PUBLIC_SUPABASE_*` environment variables are set and valid
- **Build failures**: Tailwind v4 requires proper PostCSS config with `@tailwindcss/postcss` plugin
- **Admin operations**: Require `SUPABASE_SERVICE_ROLE_KEY` environment variable
- **Windows development**: Automatic fs.readlink patch applied via `scripts/patch-fs-readlink.cjs`
- **CSP violations**: Development allows unsafe-inline for HMR; production uses strict nonces

### Performance & Monitoring
- Database optimization views: `public.index_usage_stats`, `public.table_stats`
- RLS helper functions: `user_has_world_access()`, `user_can_edit_world()`, `user_is_world_admin()`
- Composite indexes for world access, membership, and entity searches
- GIN indexes for JSONB field searches

## License & Support
- Private project; no license file present
- Open issues and discussions on the repository as needed

