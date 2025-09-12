**Supabase Schema & RLS Overview**

- **Scope:** Public schema tables, Row Level Security (RLS) policies, and Storage policies as of latest migrations.
- **Highlights:** Uses scalar subselects for `auth.*` calls in RLS; consolidates duplicate SELECT policies; per‑action manage policies; idempotent DROP+CREATE for stability.

**Tables**
- **profiles:** Basic user profile keyed by `auth.users.id`.
- **worlds:** World container; owned by `owner_id`; may be public or private.
- **world_members:** Memberships with roles (`admin`, `editor`, `viewer`).
- **folders:** World-scoped folder hierarchy for organizing entities/templates.
- **templates:** System (`world_id IS NULL`) and world-scoped templates.
- **entities:** World-scoped content records.
- **relationships:** Edges between entities with `relationship_type` and unique triplet index.
- **world_bans:** Per‑world ban list.
- **world_invites:** Invitation tokens by email + role for joining worlds.
- **activity_logs:** Append-only audit of actions in worlds.
- **world_files:** Metadata for files tied to worlds; paired with Storage bucket objects.

**RLS Policies (Public Schema)**
- `profiles` (view/update own)
  - SELECT: "Users can view their own profile" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:12`
  - UPDATE: "Users can update their own profile" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:17`
  - Note: Profile inserts are system/seeded; no public INSERT policy.

- `worlds` (access via helper; owner controls write)
  - SELECT: "world_select_member" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:31`
  - INSERT: "world_insert" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:38`
  - UPDATE: "world_update_owner" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:42`
  - DELETE: "world_delete_owner" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:46`

- `world_members` (owner manages; separate per action)
  - SELECT: "world_member_select" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:56`
  - INSERT: "world_member_insert_owner" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:50`
  - UPDATE: "world_member_update_owner" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:56`
  - DELETE: "world_member_delete_owner" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:62`

- `folders` (accessible vs. editable worlds)
  - SELECT: "Users can view folders in accessible worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:75`
  - INSERT: "Users can create folders in editable worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:78`
  - UPDATE: "Users can update folders in editable worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:87`
  - DELETE: "Users can delete folders in editable worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:96`

- `templates` (global or world-scoped)
  - SELECT: "Users can view accessible templates" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:112`
  - INSERT: "Users can create templates in editable worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:118`
  - UPDATE: "Users can update templates in editable worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:128`
  - DELETE: "Users can delete templates in editable worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:137`

- `entities` (accessible vs. editable worlds)
  - SELECT: "Users can view entities in accessible worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:152`
  - INSERT: "Users can create entities in editable worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:155`
  - UPDATE: "Users can update entities in editable worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:164`
  - DELETE: "Users can delete entities in editable worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:173`

- `relationships` (accessible vs. editable worlds)
  - SELECT: "Users can view relationships in accessible worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:188`
  - INSERT: "Users can create relationships in editable worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:191`
  - UPDATE: "Users can update relationships in editable worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:200`
  - DELETE: "Users can delete relationships in editable worlds" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:209`

- `world_bans` (owners/admins manage)
  - SELECT: "Users can view bans for worlds they own" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:225`
  - INSERT: "ban_insert_manage" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:230`
  - UPDATE: "ban_update_manage" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:240`
  - DELETE: "ban_delete_manage" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:250`

- `world_invites` (owner/admin manage; recipient can accept)
  - SELECT: "invites_select" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:267`
  - INSERT: "invites_insert" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:277`
  - UPDATE (manage): "invites_update_manage" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:286`
  - UPDATE (accept): "invites_update_accept" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:296`
  - DELETE: "invites_delete" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:300`

- `activity_logs`
  - SELECT: "activity_select" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:310`
  - INSERT: "activity_insert" `supabase/migrations/20250907020000_add_invites_activity_files.sql:106`

- `world_files`
  - SELECT: "files_select" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:320`
  - INSERT: "files_insert" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:329`
  - DELETE: "files_delete" `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql:338`

**Storage (Bucket: world-assets)**
- SELECT: "world-assets read" `supabase/migrations/20250907170000_add_storage_policies.sql:15`
- INSERT: "world-assets insert" `supabase/migrations/20250907170000_add_storage_policies.sql:33`
- DELETE: "world-assets delete" `supabase/migrations/20250907170000_add_storage_policies.sql:53`
- Notes:
  - Private bucket; policies mirror `public.world_files` and world access.
  - `world_files.file_path` must match `storage.objects.name`.

**Helper Functions & Triggers**
- `user_has_world_access(world_uuid, user_uuid)` (owner OR public world OR membership)
  - Definition: `supabase/migrations/20250906000002_create_policies.sql:31`
- `public.accept_world_invite(invite_token text)` RPC
  - Definition: `supabase/migrations/20250907020000_add_invites_activity_files.sql:193`

**Policy Conventions**
- Uses `(SELECT auth.uid())` and `(SELECT auth.jwt())` inside policy expressions to avoid per-row function re-evaluation.
- Duplicate permissive SELECT policies for `worlds` were removed in favor of a single helper-driven policy.
- Broad FOR ALL policies were split into per-action variants to keep SELECT distinct from write permissions.

**Recent Changes**
- Optimized RLS calls and made policy migrations idempotent: `supabase/migrations/20250907173500_optimize_rls_auth_calls.sql`
- Consolidated migrations by removing a redundant baseline: deleted `supabase/migrations/20250907013251_initial_setup.sql`.

