# WorldWeaver TODO (Deploy-Ready Breakdown)

This is a step-by-step checklist to get the app fully functional and ready to deploy. File paths are relative to `worldweaver-ui/`.

Legend:
- [x] Completed  ·  [ ] Pending  ·  [~] In progress  ·  (P0) Critical  ·  (P1) High  ·  (P2) Nice-to-have

## 1) Database & Policies
- [x] (P0) Apply invites/activity/files migration in Supabase SQL Editor
  - SQL: `supabase/migrations/20250907020000_add_invites_activity_files.sql`
- [x] (P0) Document incremental SQL in `DATABASE_SCHEMA.md` (Invites/Activity/Files + RPC)
- [ ] (P0) Storage bucket for files
  - Create private bucket `world-assets` in Supabase Storage
  - Add storage policies mirroring `public.world_files` RLS
- [x] (P1) Ensure performance indexes
  - `templates(name) WHERE is_system AND world_id IS NULL`
  - `templates(world_id, name)`, `worlds(is_archived)`, `entities(world_id, updated_at)`
- [ ] (P2) Unify baseline + incremental migrations documentation (choose one authoritative path)

## 2) API & Feature Work
- Worlds (REST)
  - [x] (P0) Implement `GET/PUT/DELETE /api/worlds/[id]` using SSR Supabase client
  - [x] (P0) Add request body validation (zod) to PUT
- Invites
  - [x] (P0) Create invite: `POST /api/worlds/[id]/invites`
  - [x] (P0) Accept invite: `POST /api/invites/accept` + `RPC accept_world_invite`
  - [x] (P1) List invites for a world: `GET /api/worlds/[id]/invites`
  - [x] (P1) Revoke invite: `DELETE /api/worlds/[id]/invites/[inviteId]`
- Entities
  - [x] (P0) CRUD API: `GET/POST /api/worlds/[id]/entities`, `GET/PUT/DELETE /api/entities/[id]`
  - [x] (P1) Server-side validation (zod) and RLS-aware filters
- Templates (custom per world)
  - [x] (P1) CRUD API for world templates (system templates editable via per-world override)
- Folders
  - [x] (P1) CRUD API: world folders + move entity to folder
- Relationships
  - [ ] (P1) CRUD API using unique index on `(from_entity_id,to_entity_id,relationship_type)`

## 3) Types & Codebase Cleanup
- [x] (P0) Prefer `src/lib/supabase/types.generated.ts` as DB type source
- [ ] (P1) Regenerate Supabase types from Dashboard and update `types.generated.ts`
- [ ] (P1) Retire `src/lib/supabase/database.types.ts` and update any lingering imports
- [x] (P0) Ensure all services use SSR client per-request (`src/lib/supabase/server.ts`)

## 4) Security & Hardening
- [x] (P0) Gate admin seeder to dev-only (blocked in prod unless `ADMIN_SEED_ENABLED=true`)
- [ ] (P0) Add zod validation to all POST/PUT APIs (worlds, invites, entities, templates)
- [ ] (P1) Add basic rate limiting (invite creation, admin endpoints)
- [ ] (P2) Add security headers & CSP via middleware (optional for MVP)

## 5) UI Work
- Invites (Owner/Admin)
  - [ ] (P1) World screen: list pending invites (email, role, status, expiry)
  - [ ] (P1) Actions: copy invite link, revoke invite
- Entities
  - [ ] (P0) Wire create/edit/list to Supabase API; remove mock fallback for authenticated users
- Templates
  - [ ] (P1) Add UI to create/list/edit world templates (system templates remain read-only)
- Folders
  - [ ] (P1) Folder tree CRUD + filter entities by folder
- UX polish
  - [ ] (P2) Toasts for success/error; loading states; empty states

## 6) Testing & QA
- [x] (P1) Auth-aware API test script (`scripts/test-api-endpoints.js`)
- [ ] (P1) Configure `.env.local` with `TEST_EMAIL`/`TEST_PASSWORD` for local API tests
- [ ] (P1) Add minimal Playwright smoke (login, create world, CRUD cycle) [optional]
- [ ] (P0) `npm run build` check; fix type/runtime issues reported by Next

## 7) Ops & Deployment
- [ ] (P0) Production env vars set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [x] (P1) Silence tracing root warning (see `next.config.ts: outputFileTracingRoot`)
- [ ] (P1) Add CI pipeline: install → build → (optional) API smoke
- [ ] (P2) Monitoring/telemetry (e.g., Sentry) post-MVP

## 8) Docs & DevEx
- [x] (P1) `DEVELOPMENT.md`: Recent updates summary
- [x] (P1) `DATABASE_SCHEMA.md`: Incremental Update section for invites/activity/files
- [x] (P2) `README.md`: quick links and workflows
- [ ] (P2) Add ToC to `DEVELOPMENT.md` for faster navigation

---

Next Suggested Task
- Implement Entities API (P0): add routes, zod validation, and wire UI list/create/edit to Supabase. I can start this now if you’d like.
