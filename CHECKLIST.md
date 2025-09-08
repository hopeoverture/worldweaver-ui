# Repository Health & Setup Checklist

This checklist complements `TODO.md` by focusing on repo health, build readiness, and operational guardrails. Use it to get a clean build locally and a safe deploy path.

## P0: Immediate Fixes
- [x] Dependencies in place
  - [x] `@tanstack/react-query`
  - [x] `pg` (only if keeping local Postgres helpers)
  - [x] `vitest` (test runner present; tests optional)
- [x] Next config consolidated (`next.config.ts`)
- [x] Script module style consistent (ESM scripts use `.mjs`)
- [x] Remove/retire empty or unused placeholders that broke typecheck

## P1: Tooling & Linting
- [x] ESLint flat config covers TS/Next
- [x] `npm run lint` passes in project root
- [ ] Optional: add Prettier for formatting consistency

## P1: Supabase/Auth Sanity
- [x] Provide `.env.example` and `.env.local.example` (Supabase-only)
- [x] Middleware adds security headers and rate limits on API routes
- [x] `await cookies()` used in route handlers (Next 15 typing)
- [ ] Verify hosting env has required vars:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SEED_ADMIN_TOKEN`

## P1: API Coverage & Validation
- [x] CRUD coverage with Zod validation where applicable
  - Worlds: GET/POST, GET/PUT/DELETE by id
  - Entities: world list/create, entity GET/PUT/DELETE
  - Templates: world-level CRUD (system templates read-only)
  - Folders: world CRUD + update/delete
  - Invites: create/list/revoke + accept
- [x] Ensure RLS-aware filters on list endpoints

## P1: Database & Local Dev
- [ ] If using local Postgres from UI, keep `pg` under server-only scripts or separate package
- [ ] Optional connectivity checks:
  - `scripts/test-database-direct.mjs`
  - `scripts/test-database-service.ts`

## P1: Admin Seeder Hardening
- [x] Gate `src/app/api/admin/seed-core-templates/route.ts` to dev (enable via `ADMIN_SEED_ENABLED` in prod if intentional)
- [x] Protect with `SEED_ADMIN_TOKEN`

## P1: Docs
- [x] Update `README.md` quickstart (env, Supabase, scripts)
- [x] Choose one authoritative DB doc (baseline vs incremental) and link others as appendix
  - Canonical: `MIGRATIONS.md`, schema reference: `docs/SUPABASE_SCHEMA.md`

## P2: UX & Reliability
- [x] App Router error boundaries (`src/app/error.tsx`, `src/app/not-found.tsx`)
- [x] Basic toasts/loading/empty states
- [ ] Minimal smoke tests (auth + world CRUD)

## P2: CI/CD & Ops
- [ ] Add CI (install + build + lint + optional API smoke)
- [x] Security headers/CSP via middleware (as needed)
- [ ] Telemetry (e.g., Sentry) post-MVP

---

References (where applicable):
- `next.config.ts:1`
- `eslint.config.mjs:1`
- `middleware.ts:1`
- `src/lib/supabase/server.ts:1`
- `src/lib/auth/server.ts:1`
- `src/app/api/worlds/route.ts:1`
- `src/app/api/admin/seed-core-templates/route.ts:1`
- `scripts/test-api-endpoints.js:1`
- `README.md:1`
