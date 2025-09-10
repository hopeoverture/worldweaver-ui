-- WorldWeaver Database Schema - RLS Policies
-- Row Level Security policies for multi-tenant access control

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_bans ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILE POLICIES
-- =====================================================

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- =====================================================
-- HELPER FUNCTION TO CHECK WORLD ACCESS
-- =====================================================

-- Create a function to check if user has access to a world
CREATE OR REPLACE FUNCTION user_has_world_access(world_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is owner
  IF EXISTS (
    SELECT 1 FROM public.worlds 
    WHERE id = world_uuid AND owner_id = user_uuid
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if world is public
  IF EXISTS (
    SELECT 1 FROM public.worlds 
    WHERE id = world_uuid AND is_public = TRUE
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a member
  IF EXISTS (
    SELECT 1 FROM public.world_members 
    WHERE world_id = world_uuid AND user_id = user_uuid
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- WORLD POLICIES
-- =====================================================

-- Users can view worlds they own
CREATE POLICY "world_select_owner"
    ON public.worlds FOR SELECT
    USING (owner_id = auth.uid());

-- Users can view public worlds  
CREATE POLICY "world_select_public"
    ON public.worlds FOR SELECT
    USING (is_public = TRUE);

-- Users can view worlds they are members of
CREATE POLICY "world_select_member"
    ON public.worlds FOR SELECT
    USING (user_has_world_access(id, auth.uid()));

-- Users can create worlds
CREATE POLICY "world_insert"
    ON public.worlds FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Owners can update their worlds
CREATE POLICY "world_update_owner"
    ON public.worlds FOR UPDATE
    USING (owner_id = auth.uid());

-- Owners can delete their worlds
CREATE POLICY "world_delete_owner"
    ON public.worlds FOR DELETE
    USING (owner_id = auth.uid());

-- =====================================================
-- WORLD MEMBER POLICIES
-- =====================================================

-- Users can view memberships for accessible worlds
CREATE POLICY "world_member_select"
    ON public.world_members FOR SELECT
    USING (user_has_world_access(world_id, auth.uid()));

-- Users can manage memberships for worlds they own
CREATE POLICY "world_member_manage_owner"
    ON public.world_members FOR ALL
    USING (
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- FOLDER POLICIES
-- =====================================================

CREATE POLICY "Users can view folders in accessible worlds"
    ON public.folders FOR SELECT
    USING (user_has_world_access(world_id, auth.uid()));

CREATE POLICY "Users can create folders in editable worlds"
    ON public.folders FOR INSERT
    WITH CHECK (
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        ) OR
        world_id IN (
            SELECT world_id FROM public.world_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Users can update folders in editable worlds"
    ON public.folders FOR UPDATE
    USING (
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        ) OR
        world_id IN (
            SELECT world_id FROM public.world_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Users can delete folders in editable worlds"
    ON public.folders FOR DELETE
    USING (
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        ) OR
        world_id IN (
            SELECT world_id FROM public.world_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

-- =====================================================
-- TEMPLATE POLICIES  
-- =====================================================

CREATE POLICY "Users can view accessible templates"
    ON public.templates FOR SELECT
    USING (
        world_id IS NULL OR -- System templates
        user_has_world_access(world_id, auth.uid())
    );

CREATE POLICY "Users can create templates in editable worlds"
    ON public.templates FOR INSERT
    WITH CHECK (
        world_id IS NULL OR -- System templates (restricted in app logic)
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        ) OR
        world_id IN (
            SELECT world_id FROM public.world_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Users can update templates in editable worlds"
    ON public.templates FOR UPDATE
    USING (
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        ) OR
        world_id IN (
            SELECT world_id FROM public.world_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Users can delete templates in editable worlds"
    ON public.templates FOR DELETE
    USING (
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        ) OR
        world_id IN (
            SELECT world_id FROM public.world_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

-- =====================================================
-- ENTITY POLICIES
-- =====================================================

CREATE POLICY "Users can view entities in accessible worlds"
    ON public.entities FOR SELECT
    USING (user_has_world_access(world_id, auth.uid()));

CREATE POLICY "Users can create entities in editable worlds"
    ON public.entities FOR INSERT
    WITH CHECK (
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        ) OR
        world_id IN (
            SELECT world_id FROM public.world_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Users can update entities in editable worlds"
    ON public.entities FOR UPDATE
    USING (
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        ) OR
        world_id IN (
            SELECT world_id FROM public.world_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Users can delete entities in editable worlds"
    ON public.entities FOR DELETE
    USING (
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        ) OR
        world_id IN (
            SELECT world_id FROM public.world_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

-- =====================================================
-- RELATIONSHIP POLICIES
-- =====================================================

CREATE POLICY "Users can view relationships in accessible worlds"
    ON public.relationships FOR SELECT
    USING (user_has_world_access(world_id, auth.uid()));

CREATE POLICY "Users can create relationships in editable worlds"
    ON public.relationships FOR INSERT
    WITH CHECK (
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        ) OR
        world_id IN (
            SELECT world_id FROM public.world_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Users can update relationships in editable worlds"
    ON public.relationships FOR UPDATE
    USING (
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        ) OR
        world_id IN (
            SELECT world_id FROM public.world_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Users can delete relationships in editable worlds"
    ON public.relationships FOR DELETE
    USING (
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        ) OR
        world_id IN (
            SELECT world_id FROM public.world_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

-- =====================================================
-- WORLD BAN POLICIES
-- =====================================================

CREATE POLICY "Users can view bans for worlds they own"
    ON public.world_bans FOR SELECT
    USING (
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "World owners and admins can manage bans"
    ON public.world_bans FOR ALL
    USING (
        world_id IN (
            SELECT id FROM public.worlds WHERE owner_id = auth.uid()
        ) OR
        world_id IN (
            SELECT world_id FROM public.world_members 
            WHERE user_id = auth.uid() AND role IN ('admin')
        )
    );
