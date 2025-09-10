Supabase Migrations Guide

Authoritative migration path and conventions for WorldWeaver.

Authoritative order
1) supabase/migrations/20250906000001_create_tables.sql
2) supabase/migrations/20250906000002_create_policies.sql
3) supabase/migrations/20250907020000_add_invites_activity_files.sql
4) supabase/migrations/20250907170000_add_storage_policies.sql
5) supabase/migrations/20250907173500_optimize_rls_auth_calls.sql

Notes
- Removed: supabase/migrations/20250907013251_initial_setup.sql (redundant with 000001/000002). Do not reintroduce.
- RLS policy changes use DROP POLICY IF EXISTS + CREATE POLICY, not ALTER POLICY, to stay idempotent across environments.
- auth.* calls in policies use scalar subselects: (SELECT auth.uid()), (SELECT auth.jwt()). This reduces per-row evaluation overhead.
- Prefer per-action policies over FOR ALL, unless truly identical logic.

Storage bucket
- Private bucket id/name: world-assets
- If missing, create via SQL (idempotent):
  insert into storage.buckets (id, name, public)
  values ('world-assets','world-assets', false)
  on conflict (id) do nothing;
- Policies applied in 20250907170000_add_storage_policies.sql (read/insert/delete) and RLS is enabled on storage.objects.

Applying migrations
- Dev (fresh): apply in timestamp order with Supabase CLI or Dashboard SQL editor.
- Existing envs: run each migration in order; since policy changes are idempotent, re-running is safe.

Creating new migrations
- Include DEFENSIVE drops for policies you modify (DROP POLICY IF EXISTS) and then CREATE with explicit FOR SELECT/INSERT/UPDATE/DELETE.
- Avoid broad FOR ALL unless necessary; split by action to keep SELECT separate from write permissions.
- Use helper functions (e.g., user_has_world_access(world_uuid, user_uuid)) to centralize access logic.

Related docs
- docs/SUPABASE_SCHEMA.md — current schema and RLS policy reference

