# Supabase-Only Migration Guide (Remove Mock Data + Local Store)

This guide explains how to remove mock data and the local store as sources of truth so WorldWeaver runs 100% on Supabase (RLS enforced), end-to-end.

## Overview

Goals:
- Eliminate mock data everywhere (no fallback in API or UI).
- Remove data responsibilities from the local Zustand store (keep UI-only state, or remove it).
- Fetch all data from Supabase via protected API routes; perform all writes through API.

Result:
- A single source of truth (Supabase) with RLS and policies.
- Cleaner API boundary and testability.

## Prerequisites

- Supabase env configured in `worldweaver-ui/.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - For seeding (dev only): `SUPABASE_SERVICE_ROLE_KEY`, `SEED_ADMIN_TOKEN`
- Migrations applied (initial + invites/activity/files + RPC):
  - `supabase/migrations/20250906000001_create_tables.sql`
  - `supabase/migrations/20250906000002_create_policies.sql`
  - `supabase/migrations/20250907013251_initial_setup.sql`
  - `supabase/migrations/20250907020000_add_invites_activity_files.sql`
- Dev server runs cleanly: `npm run dev`

Optional (recommended):
- Regenerate Supabase types after schema changes:

```bash
# Example: generate to src/lib/supabase/types.generated.ts
supabase gen types typescript --linked --schema public > worldweaver-ui/src/lib/supabase/types.generated.ts

# Or generate to database.types.ts (app-preferred file)
supabase gen types typescript --linked --schema public > worldweaver-ui/src/lib/supabase/database.types.ts
```

Note: Both `src/lib/supabase/types.generated.ts` and `src/lib/supabase/database.types.ts` exist. Prefer importing `Json` and `Database` from `src/lib/supabase/database.types.ts` in app code.

## JSON Columns and TypeScript

Several tables use JSON columns (e.g., `worlds.settings`, `entities.data`, `templates.fields`). When inserting/updating through Supabase, ensure the payload is typed as `Json` to satisfy TypeScript overloads:

```ts
import type { Json } from '@/lib/supabase/database.types'

// Example: creating an entity
const { data: row } = await supabase
  .from('entities')
  .insert({
    world_id: worldId,
    name: data.name,
    data: (data.fields ?? {}) as Json,
    tags: data.tags ?? [],
  })
  .select('*')
  .single()

// Example: creating a world with settings
await supabase.from('worlds').insert({
  name: data.name,
  description: data.description || '',
  is_public: !!data.isPublic,
  is_archived: false,
  settings: {} as Json,
})

// Example: creating/updating a template
await supabase.from('templates').insert({
  world_id: worldId,
  name: data.name,
  fields: (data.fields ?? []) as Json,
  is_system: false,
})

const patch: any = {}
if ((data as any).fields !== undefined) patch.fields = ((data as any).fields) as Json
await supabase.from('templates').update(patch).eq('id', templateId)
```

This avoids “No overload matches this call” errors by aligning payloads to the `Json` union type.

## Phase 0 - Baseline Branch (Optional)

- [x] Create a branch: `git checkout -b chore/supabase-only-migration`

## Phase 1 - Remove API Fallbacks

Files to update:
- [x] `src/app/api/worlds/route.ts` (removed mock fallbacks, validation with zod for POST)
- [x] Any other API route importing `@/lib/mockData` (none should remain)

Actions:
- [x] Delete all imports/usages of `@/lib/mockData`.
- For unauthenticated requests, return 401 (`{ error: 'Authentication required' }`) — do not inject mock data.
- For database errors, return 500 with clear `{ error: '...' }` — no mock fallback.

Verification:
- GET `/api/worlds` without a session returns 401.
- With a session, it returns only Supabase data.

## Phase 2 - Remove `USE_API` and Mock Branches From Store

File: `src/lib/store.ts`

Actions:
- [x] Remove the `USE_API` toggle and all mock branches in `src/lib/store.ts`.
- [x] Functions now exclusively call API routes (loadUserWorlds, addWorld, updateWorld, deleteWorld, archive/unarchive, inviteMember).
- [x] Initial store arrays set to empty (no seeded mock data).
- [ ] Reduce/remove any remaining store data usage in UI as Phase 3 migrates to live queries.

Search:

```bash
rg -n "mockData|seed\.|USE_API|invitesFallback|getWorldInvites\(" worldweaver-ui/src
```

## Phase 3 - Replace Local Store Data With Remote Data

Choose one approach:

### Option A: TanStack Query Hooks (Recommended)

Install dependency:

```bash
npm i @tanstack/react-query
```

Add hooks (examples):

- `src/hooks/query/useWorlds.ts`

```ts
import { useQuery } from '@tanstack/react-query'

export function useWorlds() {
  return useQuery({
    queryKey: ['worlds'],
    queryFn: async () => {
      const res = await fetch('/api/worlds', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load worlds')
      const body = await res.json()
      return body.worlds as any[]
    },
  })
}
```

- `src/hooks/query/useWorld.ts`

```ts
import { useQuery } from '@tanstack/react-query'

export function useWorld(id: string) {
  return useQuery({
    queryKey: ['world', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${id}`, { credentials: 'include' })
      if (res.status === 404) return null
      if (!res.ok) throw new Error('Failed to load world')
      const body = await res.json()
      return body.world
    },
  })
}
```

- `src/hooks/query/useInvites.ts`

```ts
import { useQuery } from '@tanstack/react-query'

export function useInvites(worldId: string) {
  return useQuery({
    queryKey: ['invites', worldId],
    enabled: !!worldId,
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/invites`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load invites')
      const body = await res.json()
      return body.invites as any[]
    },
  })
}
```

Wire into the UI:
- [x] Replace `useStore().worlds` with `const { data: worlds } = useWorlds()` in `src/app/page.tsx`.
- [x] Replace Members tab invite sources with `useInvites(world.id)` and remove local invite getters.

### Option B: Server Components Fetch

In `src/app/.../page.tsx` (server components), fetch via:

```ts
const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/worlds`, {
  cache: 'no-store',
  headers: { cookie },
})
```

Pass data to client components via props.

## Phase 4 - Ensure API Coverage for All Features

Implement/verify the following endpoints before fully deleting store data:

- Worlds
  - [x] `GET /api/worlds` (list)
  - [x] `GET/PUT/DELETE /api/worlds/[id]` (PUT uses zod)
- Invites
  - [x] `POST /api/worlds/[id]/invites` (create)
  - [x] `GET /api/worlds/[id]/invites`
  - [x] `DELETE /api/worlds/[id]/invites/[inviteId]`
  - [x] `POST /api/invites/accept` (RPC-backed)
- Entities
  - [x] `GET /api/worlds/[id]/entities`
  - [x] `POST /api/worlds/[id]/entities`
  - `GET/PUT/DELETE /api/entities/[id]`
- Folders
  - [x] `GET /api/worlds/[id]/folders`
  - `POST /api/worlds/[id]/folders`
  - `PUT/DELETE /api/folders/[id]`
- Templates
  - [x] `GET /api/worlds/[id]/templates` (world + system)
  - [x] `POST /api/worlds/[id]/templates`
  - [x] `PUT/DELETE /api/templates/[id]`
- Relationships
  - `GET/POST /api/worlds/[id]/relationships`, `PUT/DELETE /api/relationships/[id]`

## Phase 5 - Delete Mock Data & Local Implementations

Remove files:
- [x] `src/lib/mockData.ts`
- (Optional) `src/lib/database/local.ts` and related local-db scripts if no longer needed.

Remove references:
- Search and remove: `mockData`, `seed.`, `getWorldInvites(`, `getWorldMembers(`, `inviteMember(`, `revokeInvite(` where these are store-backed. Replace with API calls + Query invalidation.

If Zustand is no longer used for any UI state:
- Remove `src/lib/store.ts` and all `useStore(` imports.
- Otherwise, reduce the store to UI-only state (no arrays of worlds/entities/templates, no mock data import).

## Phase 6 - Validation & Hardening

- Add zod validation to all write operations:
  - Worlds: `PUT /api/worlds/[id]` [x]; `POST /api/worlds` [x]
  - Invites: `POST /api/worlds/[id]/invites`
  - Entities/Templates/Folders/Relationships: their `POST/PUT`
- [x] Use the SSR Supabase client (`src/lib/supabase/server.ts`) in API routes for RLS.
- [x] For JSON columns, cast to `Json` as shown above to satisfy TypeScript.

## Phase 7 - Testing

- Auth-aware endpoint test: `node scripts/test-api-endpoints.js`
  - Set `TEST_EMAIL`, `TEST_PASSWORD` in `.env.local` for a real session.
- Manual UI pass:
  - Login -> create world -> list worlds -> open world -> Members tab (list/copy/revoke invites) -> accept via `/invite/accept?token=...`.
- Build: `npm run build` and fix any type/server boundary issues.

## Phase 8 - Definition of Done

- No imports of `@/lib/mockData` or local DB service for app logic.
- No store-held data arrays (worlds/entities/templates/invites) — data loaded via API or server fetch only.
- All features use Supabase-backed API routes; RLS enforced.
- `npm run build` passes; endpoint tests pass; manual smoke validated.

## Appendix - Useful Searches

```bash
# Find mock and store references
rg -n "mockData|seed\.|USE_API|useStore\(|getWorldInvites\(|getWorldMembers\(" worldweaver-ui/src

# Prefer imports from database.types; migrate old imports if needed
rg -n "supabase/types.generated" worldweaver-ui/src
```

## Appendix - Seeding Core Templates

Use the admin-only route to seed system templates. Requires `SUPABASE_SERVICE_ROLE_KEY` and `SEED_ADMIN_TOKEN`.

```bash
curl -X POST "http://localhost:3000/api/admin/seed-core-templates" \
  -H "x-admin-token: $SEED_ADMIN_TOKEN"
```

If you want, I can help wire up the TanStack Query hooks and migrate the dashboard and Members tab to live API data, then remove the store arrays.

