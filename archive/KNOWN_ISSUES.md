# Known Issues & Troubleshooting

This document lists common issues seen during development and how to resolve them.

## Supabase filter error: PGRST100 (logic tree parse)
- Symptom: `PGRST100 ... failed to parse logic tree` when filtering with multiple conditions.
- Cause: Improper PostgREST filter syntax (e.g., using commas without `or=`/`and=`).
- Fix: Use `or()`/`and()` correctly via supabase-js. Example:
  ```ts
  const { data, error } = await supabase
    .from('worlds')
    .select('*, entities(count), world_members(count)')
    .or(`owner_id.eq.${userId},world_members.user_id.eq.${userId}`)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
  ```

## Windows + Node 22: fs.readlink EISDIR
- Status: Completed (patched in repo; wired into dev/build)
- Symptom: Next build/dev crashes on Windows with `EISDIR` from `fs.readlink`.
- Fix: Repo includes a patch loader `scripts/patch-fs-readlink.cjs` and wires it into `dev`/`build` scripts. No action needed; ensure you run via `npm run dev` or `npm run build`.

## Admin seed route 404 in production
- Status: Completed (gated by default; enable via env when needed)
- Symptom: `POST /api/admin/seed-core-templates` returns 404 in production.
- Cause: Seeder is gated to dev by default.
- Fix: Set `ADMIN_SEED_ENABLED=true` on the server intentionally and include `SEED_ADMIN_TOKEN` when calling.

## Auth required on API routes
- Symptom: `401 Authentication required` from routes like `/api/worlds`.
- Fix: Sign in via the app UI, or use `scripts/test-api-endpoints.js` with `TEST_EMAIL`/`TEST_PASSWORD` configured in `.env.local` to generate Supabase auth cookies.

## Supabase OAuth redirect/callback
- Symptom: OAuth login returns to a blank or error page.
- Fix: In Supabase Dashboard → Authentication → URL Configuration set:
  - Site URL: `http://localhost:3000`
  - Redirect URLs: `http://localhost:3000/auth/callback`

## Storage uploads fail (planned feature)
- Symptom: Upload endpoints fail or return 404.
- Cause: Storage bucket not created yet.
- Fix: Create private bucket `world-assets` and add policies that mirror `public.world_files` RLS.

## Next 15: `cookies()` typing in route handlers
- Status: Completed (helpers use `await cookies()`; see `src/lib/auth/server.ts:1`)
- Symptom: Type errors or missing cookies in API route handlers.
- Fix: In route handlers and server helpers, `await cookies()` (see `src/lib/auth/server.ts`). Avoid writing logic between `createServerClient` and `supabase.auth.getUser()`.

## Legacy docs (NextAuth)
- Status: Completed (legacy sections flagged; see PHASE1_ENVIRONMENT_SETUP.md/DEVELOPMENT_ROADMAP.md/DEVELOPMENT.md)
- Symptom: Some docs reference NextAuth.
- Status: Auth is handled by Supabase via `@supabase/ssr`. See `SUPABASE_AUTH_SETUP.md`. Legacy docs are kept for reference and marked at the top.
