Supabase Auth Setup
===================

Supabase Auth is configured using `@supabase/ssr` with middleware and server-side helpers.

Key routes
- OAuth callback: `src/app/auth/callback/route.ts` (exchanges `code` for a session)
- Sign out: `src/app/auth/signout/route.ts`

Client usage
- Create client in the browser: `src/lib/supabase/browser.ts`
- Common actions:
  - `supabase.auth.signUp({ email, password })`
  - `supabase.auth.signInWithPassword({ email, password })`
  - `supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: '/auth/callback' } })`
  - `supabase.auth.signOut()`

Server usage
- In API routes, use `createClient` from `src/lib/supabase/server.ts` or `getServerAuth` from `src/lib/auth/server.ts`.
- RLS remains enforced; check `user` as needed and return 401 when absent.

Dashboard settings
- Authentication URL Configuration:
  - Site URL: `http://localhost:3000`
  - Redirect URLs: `http://localhost:3000/auth/callback`

Environment
- Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Housekeeping
- Removed NextAuth dependencies and routes.

