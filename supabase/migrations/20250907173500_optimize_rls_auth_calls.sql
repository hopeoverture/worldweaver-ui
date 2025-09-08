-- Optimize RLS policies by calling auth.* via scalar subselects
-- and consolidate duplicate permissive SELECT policies.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- NOTE: This migration only changes policy expressions and drops redundant policies.
-- It does not broaden access; it reduces per-row re-evaluation cost and removes
-- duplicate permissive SELECT policies for better performance.

-- =============================
-- PROFILES
-- =============================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

-- =============================
-- WORLDS
-- =============================
-- Keep a single SELECT policy that already covers ownership/public/membership via helper
-- Drop redundant SELECT policies if they exist
DROP POLICY IF EXISTS "world_select_owner" ON public.worlds;
DROP POLICY IF EXISTS "world_select_public" ON public.worlds;

-- Ensure the remaining SELECT policy uses scalar subselect
DROP POLICY IF EXISTS "world_select_member" ON public.worlds;
CREATE POLICY "world_select_member"
  ON public.worlds FOR SELECT
  USING (user_has_world_access(id, (SELECT auth.uid())));

-- Insert/Update/Delete use scalar subselects
DROP POLICY IF EXISTS "world_insert" ON public.worlds;
CREATE POLICY "world_insert" ON public.worlds
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "world_update_owner" ON public.worlds;
CREATE POLICY "world_update_owner" ON public.worlds
  FOR UPDATE
  USING ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "world_delete_owner" ON public.worlds;
CREATE POLICY "world_delete_owner" ON public.worlds
  FOR DELETE
  USING ((SELECT auth.uid()) = owner_id);

-- =============================
-- WORLD MEMBERS
-- =============================
-- View memberships for accessible worlds
DROP POLICY IF EXISTS "world_member_select" ON public.world_members;
CREATE POLICY "world_member_select"
  ON public.world_members FOR SELECT
  USING (user_has_world_access(world_id, (SELECT auth.uid())));

-- Replace FOR ALL manage policy with per-action policies that do not include SELECT
DROP POLICY IF EXISTS "world_member_manage_owner" ON public.world_members;

CREATE POLICY "world_member_insert_owner"
  ON public.world_members FOR INSERT
  WITH CHECK (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid()))
  );

CREATE POLICY "world_member_update_owner"
  ON public.world_members FOR UPDATE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid()))
  );

CREATE POLICY "world_member_delete_owner"
  ON public.world_members FOR DELETE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid()))
  );

-- =============================
-- FOLDERS
-- =============================
-- Drop duplicate policies introduced elsewhere and keep per-action ones
DROP POLICY IF EXISTS "folder_select" ON public.folders;
DROP POLICY IF EXISTS "folder_modify" ON public.folders;

DROP POLICY IF EXISTS "Users can view folders in accessible worlds" ON public.folders;
CREATE POLICY "Users can view folders in accessible worlds"
  ON public.folders FOR SELECT
  USING (user_has_world_access(world_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can create folders in editable worlds" ON public.folders;
CREATE POLICY "Users can create folders in editable worlds"
  ON public.folders FOR INSERT
  WITH CHECK (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Users can update folders in editable worlds" ON public.folders;
CREATE POLICY "Users can update folders in editable worlds"
  ON public.folders FOR UPDATE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Users can delete folders in editable worlds" ON public.folders;
CREATE POLICY "Users can delete folders in editable worlds"
  ON public.folders FOR DELETE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
    )
  );

-- =============================
-- TEMPLATES
-- =============================
-- Drop duplicate short-named policies and use detailed per-action ones
DROP POLICY IF EXISTS "template_select" ON public.templates;
DROP POLICY IF EXISTS "template_modify" ON public.templates;

DROP POLICY IF EXISTS "Users can view accessible templates" ON public.templates;
CREATE POLICY "Users can view accessible templates"
  ON public.templates FOR SELECT
  USING (
    world_id IS NULL OR
    user_has_world_access(world_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can create templates in editable worlds" ON public.templates;
CREATE POLICY "Users can create templates in editable worlds"
  ON public.templates FOR INSERT
  WITH CHECK (
    world_id IS NULL OR
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Users can update templates in editable worlds" ON public.templates;
CREATE POLICY "Users can update templates in editable worlds"
  ON public.templates FOR UPDATE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Users can delete templates in editable worlds" ON public.templates;
CREATE POLICY "Users can delete templates in editable worlds"
  ON public.templates FOR DELETE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
    )
  );

-- =============================
-- ENTITIES
-- =============================
DROP POLICY IF EXISTS "entity_select" ON public.entities;
DROP POLICY IF EXISTS "entity_modify" ON public.entities;

DROP POLICY IF EXISTS "Users can view entities in accessible worlds" ON public.entities;
CREATE POLICY "Users can view entities in accessible worlds"
  ON public.entities FOR SELECT
  USING (user_has_world_access(world_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can create entities in editable worlds" ON public.entities;
CREATE POLICY "Users can create entities in editable worlds"
  ON public.entities FOR INSERT
  WITH CHECK (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Users can update entities in editable worlds" ON public.entities;
CREATE POLICY "Users can update entities in editable worlds"
  ON public.entities FOR UPDATE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Users can delete entities in editable worlds" ON public.entities;
CREATE POLICY "Users can delete entities in editable worlds"
  ON public.entities FOR DELETE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
    )
  );

-- =============================
-- RELATIONSHIPS
-- =============================
DROP POLICY IF EXISTS "relationship_select" ON public.relationships;
DROP POLICY IF EXISTS "relationship_modify" ON public.relationships;

DROP POLICY IF EXISTS "Users can view relationships in accessible worlds" ON public.relationships;
CREATE POLICY "Users can view relationships in accessible worlds"
  ON public.relationships FOR SELECT
  USING (user_has_world_access(world_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can create relationships in editable worlds" ON public.relationships;
CREATE POLICY "Users can create relationships in editable worlds"
  ON public.relationships FOR INSERT
  WITH CHECK (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Users can update relationships in editable worlds" ON public.relationships;
CREATE POLICY "Users can update relationships in editable worlds"
  ON public.relationships FOR UPDATE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Users can delete relationships in editable worlds" ON public.relationships;
CREATE POLICY "Users can delete relationships in editable worlds"
  ON public.relationships FOR DELETE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
    )
  );

-- =============================
-- WORLD BANS
-- =============================
-- Remove any FOR ALL manage policies and split into per-action
DROP POLICY IF EXISTS "ban_manage" ON public.world_bans;
DROP POLICY IF EXISTS "World owners and admins can manage bans" ON public.world_bans;

DROP POLICY IF EXISTS "Users can view bans for worlds they own" ON public.world_bans;
CREATE POLICY "Users can view bans for worlds they own"
  ON public.world_bans FOR SELECT
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid()))
  );

CREATE POLICY "ban_insert_manage" ON public.world_bans
  FOR INSERT
  WITH CHECK (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin')
    )
  );

CREATE POLICY "ban_update_manage" ON public.world_bans
  FOR UPDATE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin')
    )
  );

CREATE POLICY "ban_delete_manage" ON public.world_bans
  FOR DELETE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin')
    )
  );

-- =============================
-- INVITES / ACTIVITY / FILES
-- =============================
-- Wrap auth.* in scalar subselects in these policies too

-- world_invites
DROP POLICY IF EXISTS "Invites update (manage or accept)" ON public.world_invites;
DROP POLICY IF EXISTS "invites_select" ON public.world_invites;
CREATE POLICY "invites_select" ON public.world_invites
  FOR SELECT
  USING (
    lower(email) = lower(coalesce((SELECT auth.jwt()) ->> 'email', '')) OR
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin')
    )
  );

DROP POLICY IF EXISTS "invites_insert" ON public.world_invites;
CREATE POLICY "invites_insert" ON public.world_invites
  FOR INSERT
  WITH CHECK (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin')
    )
  );

DROP POLICY IF EXISTS "invites_update_manage" ON public.world_invites;
CREATE POLICY "invites_update_manage" ON public.world_invites
  FOR UPDATE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "invites_update_accept" ON public.world_invites;
CREATE POLICY "invites_update_accept" ON public.world_invites
  FOR UPDATE
  USING (lower(email) = lower(coalesce((SELECT auth.jwt()) ->> 'email', '')))
  WITH CHECK (lower(email) = lower(coalesce((SELECT auth.jwt()) ->> 'email', '')));

DROP POLICY IF EXISTS "invites_delete" ON public.world_invites;
CREATE POLICY "invites_delete" ON public.world_invites
  FOR DELETE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin')
    )
  );

-- activity_logs
DROP POLICY IF EXISTS "activity_select" ON public.activity_logs;
CREATE POLICY "activity_select" ON public.activity_logs
  FOR SELECT
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- world_files
DROP POLICY IF EXISTS "files_select" ON public.world_files;
CREATE POLICY "files_select" ON public.world_files
  FOR SELECT
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "files_insert" ON public.world_files;
CREATE POLICY "files_insert" ON public.world_files
  FOR INSERT
  WITH CHECK (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "files_delete" ON public.world_files;
CREATE POLICY "files_delete" ON public.world_files
  FOR DELETE
  USING (
    uploaded_by = (SELECT auth.uid()) OR
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid()))
  );
