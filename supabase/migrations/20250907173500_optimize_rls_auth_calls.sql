-- Optimize RLS policies by calling auth.* via scalar subselects
-- This reduces per-row re-evaluation costs. See Supabase docs:
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- PROFILES
alter policy "Users can view own profile" on public.profiles
  using ((select auth.uid()) = id);

alter policy "Users can update own profile" on public.profiles
  using ((select auth.uid()) = id);

alter policy "Users can insert own profile" on public.profiles
  with check ((select auth.uid()) = id);

-- WORLDS
alter policy "Users can view accessible worlds" on public.worlds
  using (
    is_public = true OR 
    owner_id = (select auth.uid()) OR
    id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (select auth.uid())
    )
  );

alter policy "Users can create worlds" on public.worlds
  with check ((select auth.uid()) = owner_id);

alter policy "Users can update owned/admin worlds" on public.worlds
  using (
    owner_id = (select auth.uid()) OR
    id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (select auth.uid()) AND role IN ('admin')
    )
  );

alter policy "Users can delete owned worlds" on public.worlds
  using (owner_id = (select auth.uid()));

-- WORLD MEMBERS
alter policy "Users can view world members" on public.world_members
  using (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = (select auth.uid()) OR id IN (
        SELECT world_id FROM public.world_members WHERE user_id = (select auth.uid())
      )
    )
  );

alter policy "Owners and admins can manage members" on public.world_members
  using (
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = (select auth.uid())
    ) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (select auth.uid()) AND role IN ('admin')
    )
  );

-- WORLD INVITES
alter policy "Users can view relevant invites" on public.world_invites
  using (
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = (select auth.uid())
    ) OR
    invited_by = (select auth.uid()) OR
    email IN (
      SELECT email FROM public.profiles WHERE id = (select auth.uid())
    )
  );

alter policy "Owners and admins can create invites" on public.world_invites
  with check (
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = (select auth.uid())
    ) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (select auth.uid()) AND role IN ('admin')
    )
  );

-- TEMPLATES
alter policy "Users can view accessible templates" on public.templates
  using (
    is_system = true OR
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = (select auth.uid()) OR id IN (
        SELECT world_id FROM public.world_members WHERE user_id = (select auth.uid())
      )
    )
  );

alter policy "Users can create world templates" on public.templates
  with check (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = (select auth.uid()) OR id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = (select auth.uid()) AND role IN ('admin', 'editor')
      )
    )
  );

alter policy "Users can update own templates" on public.templates
  using (
    created_by = (select auth.uid()) OR
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = (select auth.uid())
    )
  );

-- ENTITIES
alter policy "Users can view accessible entities" on public.entities
  using (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE is_public = true OR owner_id = (select auth.uid()) OR id IN (
        SELECT world_id FROM public.world_members WHERE user_id = (select auth.uid())
      )
    )
  );

alter policy "Users can create entities" on public.entities
  with check (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = (select auth.uid()) OR id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = (select auth.uid()) AND role IN ('admin', 'editor')
      )
    )
  );

alter policy "Users can update accessible entities" on public.entities
  using (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = (select auth.uid()) OR id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = (select auth.uid()) AND role IN ('admin', 'editor')
      )
    )
  );

alter policy "Users can delete entities" on public.entities
  using (
    created_by = (select auth.uid()) OR
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = (select auth.uid())
    )
  );

-- FOLDERS
alter policy "Users can view accessible folders" on public.folders
  using (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = (select auth.uid()) OR id IN (
        SELECT world_id FROM public.world_members WHERE user_id = (select auth.uid())
      )
    )
  );

alter policy "Users can manage folders" on public.folders
  using (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = (select auth.uid()) OR id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = (select auth.uid()) AND role IN ('admin', 'editor')
      )
    )
  );

-- RELATIONSHIPS
alter policy "Users can view accessible relationships" on public.relationships
  using (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = (select auth.uid()) OR id IN (
        SELECT world_id FROM public.world_members WHERE user_id = (select auth.uid())
      )
    )
  );

alter policy "Users can manage relationships" on public.relationships
  using (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = (select auth.uid()) OR id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = (select auth.uid()) AND role IN ('admin', 'editor')
      )
    )
  );

-- ACTIVITY LOGS
alter policy "Users can view world activity" on public.activity_logs
  using (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = (select auth.uid()) OR id IN (
        SELECT world_id FROM public.world_members WHERE user_id = (select auth.uid())
      )
    )
  );

-- WORLD FILES
alter policy "Users can view world files" on public.world_files
  using (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = (select auth.uid()) OR id IN (
        SELECT world_id FROM public.world_members WHERE user_id = (select auth.uid())
      )
    )
  );

alter policy "Users can upload files" on public.world_files
  with check (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = (select auth.uid()) OR id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = (select auth.uid()) AND role IN ('admin', 'editor')
      )
    )
  );

alter policy "Users can delete own files" on public.world_files
  using (
    uploaded_by = (select auth.uid()) OR
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = (select auth.uid())
    )
  );

