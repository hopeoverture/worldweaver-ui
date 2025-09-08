WorldWeaver UI
================

Next.js App Router UI for WorldWeaver with Supabase auth/data. This README captures the practical steps to get a clean local build, run the app, and seed core templates.

Current Build
-------------
- Node: 18+ (Node 22 supported; Windows readlink patch auto-applied)
- Next.js: 15.5.2
- React: 19.1.0
- Tailwind CSS: 4.1.x
- Auth/DB: Supabase via `@supabase/ssr`

Quick Start
-----------

Prerequisites
- Node 18+ (Node 22 works; Windows readlink quirk is patched automatically)
- Supabase project (URL + anon/service role keys)

Install
- `npm install`

Environment
- Copy example and fill values:
  - `cp .env.example .env.local` (Windows: `copy .env.example .env.local`)
- Then edit `.env.local` to include your Supabase URL and keys
- Required:
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- Optional (admin seeding):
  - `SUPABASE_SERVICE_ROLE_KEY=...`
  - `SEED_ADMIN_TOKEN=choose-a-random-secret`
  - `SEED_BASE_URL=http://localhost:3000`
  - `ADMIN_SEED_ENABLED=true` (only if you intentionally enable seeding in production)
- Optional (local API test script):
  - `API_BASE_URL=http://localhost:3000`
  - `TEST_EMAIL`, `TEST_PASSWORD`, `TEST_INVITE_EMAIL`

Run Dev Server
- `npm run dev`
- Visit http://localhost:3000

Scripts
- `npm run dev`: Start dev server (with Windows Node 22 readlink patch)
- `npm run build`: Production build (with readlink patch)
- `npm run start`: Start production server
- `npm run lint`: Run ESLint (flat config)
- `npm run seed:core`: Seed system templates via admin route

Core Workflows
- Lint: `npm run lint`
- Build: `npm run build`
- Seed core templates (admin):
  1) Ensure env vars above are set
  2) Run: `npm run dev` (keep server running)
  3) Execute: `npm run seed:core` (calls `/api/admin/seed-core-templates`)

Notes on Windows / Node 22
- A small patch is injected via `scripts/patch-fs-readlink.cjs` to handle `fs.readlink` returning `EISDIR` on Windows. This is wired into `dev` and `build` scripts. No action needed.

Project Structure
- UI/App Router: `src/app`
- API routes (App Router): `src/app/api/**`
- Supabase client helpers (browser/server): `src/lib/supabase/*`
- Domain/service layer: `src/lib/services/*`
- Hooks (queries/mutations): `src/hooks/**`
- Components: `src/components/**`

Supabase Dashboard
- Authentication settings:
  - Site URL: `http://localhost:3000`
  - Redirect URLs: `http://localhost:3000/auth/callback`
  - Providers as needed (e.g., GitHub) redirect to `/auth/callback`

Troubleshooting
- Lint failures in scripts: scripts are excluded from lint by flat config. If you want to lint scripts, enable Node env in ESLint and align module type (CJS vs ESM).
- Seeder 404 in production: seeding route is disabled in production unless `ADMIN_SEED_ENABLED=true`. Always include the `SEED_ADMIN_TOKEN` when calling seeding.
 - Supabase filter error (PGRST100): ensure you use `or()`/`and()` syntax in PostgREST filters. Example with supabase-js: `.or('owner_id.eq.<userId>,world_members.user_id.eq.<userId>')`.

Known Issues
- See `KNOWN_ISSUES.md` for a living list of common errors and fixes.

Additional Docs
- See `CHECKLIST.md` for repo health tasks and priorities.
- See `DEVELOPMENT.md`, `DATABASE_SCHEMA.md`, and related docs for schema and migrations.
 - Older setup guides (e.g., `PHASE1_ENVIRONMENT_SETUP.md`, `DEVELOPMENT_ROADMAP.md`) include legacy NextAuth references; prefer Supabase docs above.
