-- Additional tables and indexes to support invites, activity logs, files,
-- plus useful constraints and indexes.

-- ================================
-- WORLD INVITES
-- ================================

CREATE TABLE IF NOT EXISTS public.world_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.world_invites ENABLE ROW LEVEL SECURITY;

-- View invites relevant to user (by email) or worlds they own/admin
CREATE POLICY "invites_select"
  ON public.world_invites FOR SELECT
  USING (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) OR
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = auth.uid()
    ) OR world_id IN (
      SELECT world_id FROM public.world_members WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- Owners/admins can create invites
CREATE POLICY "invites_insert"
  ON public.world_invites FOR INSERT
  WITH CHECK (
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = auth.uid()
    ) OR world_id IN (
      SELECT world_id FROM public.world_members WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- Owners/admins can update invites (manage)
CREATE POLICY "invites_update_manage"
  ON public.world_invites FOR UPDATE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = auth.uid()) OR
    world_id IN (
      SELECT world_id FROM public.world_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (true);

-- Invited user can mark their invite accepted
CREATE POLICY "invites_update_accept"
  ON public.world_invites FOR UPDATE
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  WITH CHECK (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Owners/admins can delete invites
CREATE POLICY "invites_delete"
  ON public.world_invites FOR DELETE
  USING (
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = auth.uid()
    ) OR world_id IN (
      SELECT world_id FROM public.world_members WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_world_invites_world_id ON public.world_invites(world_id);
CREATE INDEX IF NOT EXISTS idx_world_invites_email ON public.world_invites(email);

-- ================================
-- ACTIVITY LOGS
-- ================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can view activity for accessible worlds
CREATE POLICY "activity_select"
  ON public.activity_logs FOR SELECT
  USING (
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = auth.uid()
    ) OR world_id IN (
      SELECT world_id FROM public.world_members WHERE user_id = auth.uid()
    )
  );

-- Service/system may insert logs; leave permissive (adjust as needed)
CREATE POLICY "activity_insert"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_activity_logs_world_id ON public.activity_logs(world_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- ================================
-- WORLD FILES (metadata only; pair with Supabase Storage)
-- ================================

CREATE TABLE IF NOT EXISTS public.world_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.world_files ENABLE ROW LEVEL SECURITY;

-- View files in accessible worlds
CREATE POLICY "files_select"
  ON public.world_files FOR SELECT
  USING (
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = auth.uid()
    ) OR world_id IN (
      SELECT world_id FROM public.world_members WHERE user_id = auth.uid()
    )
  );

-- Upload files to editable worlds
CREATE POLICY "files_insert"
  ON public.world_files FOR INSERT
  WITH CHECK (
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = auth.uid()
    ) OR world_id IN (
      SELECT world_id FROM public.world_members WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- Delete own files or owners
CREATE POLICY "files_delete"
  ON public.world_files FOR DELETE
  USING (
    uploaded_by = auth.uid() OR world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_world_files_world_id ON public.world_files(world_id);

-- ================================
-- RELATIONSHIPS: de-duplicate constraint
-- ================================

-- Prefer a unique index to avoid duplicate relationship triplets
CREATE UNIQUE INDEX IF NOT EXISTS ux_relationships_pair_type
  ON public.relationships(from_entity_id, to_entity_id, relationship_type);

-- ================================
-- PERFORMANCE-ORIENTED INDEXES
-- ================================

-- Speed up common filters
CREATE INDEX IF NOT EXISTS idx_worlds_is_archived ON public.worlds(is_archived);
CREATE INDEX IF NOT EXISTS idx_entities_world_updated_at ON public.entities(world_id, updated_at DESC);

-- Template lookup by name + scope (used by seeding/upserts)
CREATE INDEX IF NOT EXISTS idx_templates_system_name
  ON public.templates(name) WHERE is_system = TRUE AND world_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_templates_world_name
  ON public.templates(world_id, name);

-- ================================
-- INVITE ACCEPTANCE RPC
-- ================================

-- Accept an invite by token for the currently authenticated user
-- Grants membership and marks invite as accepted
CREATE OR REPLACE FUNCTION public.accept_world_invite(invite_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_user uuid := auth.uid();
  v_world uuid;
  v_role text;
BEGIN
  -- Validate invite for this user
  SELECT wi.world_id, wi.role
    INTO v_world, v_role
  FROM public.world_invites wi
  WHERE wi.token = invite_token
    AND lower(wi.email) = v_email
    AND wi.accepted_at IS NULL
    AND wi.expires_at > NOW()
  LIMIT 1;

  IF v_world IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Grant membership (upsert)
  INSERT INTO public.world_members(world_id, user_id, role)
  VALUES (v_world, v_user, v_role::public.world_member_role)
  ON CONFLICT (world_id, user_id)
  DO UPDATE SET role = EXCLUDED.role;

  -- Mark invite accepted
  UPDATE public.world_invites
     SET accepted_at = NOW()
   WHERE token = invite_token;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_world_invite(text) TO authenticated;
