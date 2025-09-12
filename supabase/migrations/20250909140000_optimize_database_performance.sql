-- Comprehensive Database Performance Optimization
-- This migration addresses duplicate indexes, adds missing functions, and optimizes query performance

-- ================================
-- 1. REMOVE REDUNDANT OPERATIONS
-- ================================

-- Remove duplicate comment from previous migration
COMMENT ON TABLE public.worlds IS NULL;

-- ================================
-- 2. ADD MISSING HELPER FUNCTIONS
-- ================================

-- Function to check if user can edit a world (owner or editor/admin member)
CREATE OR REPLACE FUNCTION public.user_can_edit_world(world_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.worlds 
        WHERE id = world_id AND owner_id = (SELECT auth.uid())
      ) THEN TRUE
      WHEN EXISTS (
        SELECT 1 FROM public.world_members 
        WHERE world_members.world_id = user_can_edit_world.world_id 
          AND user_id = (SELECT auth.uid()) 
          AND role IN ('admin', 'editor')
      ) THEN TRUE
      ELSE FALSE
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is world admin (owner or admin member)
CREATE OR REPLACE FUNCTION public.user_is_world_admin(world_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.worlds 
        WHERE id = world_id AND owner_id = (SELECT auth.uid())
      ) THEN TRUE
      WHEN EXISTS (
        SELECT 1 FROM public.world_members 
        WHERE world_members.world_id = user_is_world_admin.world_id 
          AND user_id = (SELECT auth.uid()) 
          AND role = 'admin'
      ) THEN TRUE
      ELSE FALSE
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user email matches invite
CREATE OR REPLACE FUNCTION public.user_email_matches_invite(invite_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN lower(invite_email) = lower(coalesce((SELECT auth.jwt()) ->> 'email', ''));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ================================
-- 3. OPTIMIZE EXISTING FUNCTIONS
-- ================================

-- Optimize user_has_world_access function with better query patterns
CREATE OR REPLACE FUNCTION public.user_has_world_access(world_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Single query to check all access conditions
  RETURN EXISTS (
    SELECT 1 
    FROM public.worlds w
    LEFT JOIN public.world_members wm ON (w.id = wm.world_id AND wm.user_id = user_uuid)
    WHERE w.id = world_uuid 
      AND (
        w.owner_id = user_uuid OR  -- User is owner
        w.is_public = TRUE OR      -- World is public
        wm.user_id IS NOT NULL     -- User is member
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Alternative overload for auth.uid() calls
CREATE OR REPLACE FUNCTION public.user_has_world_access(world_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.user_has_world_access(world_id, (SELECT auth.uid()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ================================
-- 4. ADD COMPOSITE INDEXES FOR PERFORMANCE
-- ================================

-- Only add indexes if tables exist
DO $$
BEGIN
  -- Composite index for world ownership and membership queries
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'worlds') THEN
    CREATE INDEX IF NOT EXISTS idx_worlds_owner_public_archived 
      ON public.worlds (owner_id, is_public, is_archived);
  END IF;

  -- Composite index for world member access queries
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'world_members') THEN
    CREATE INDEX IF NOT EXISTS idx_world_members_world_user_role 
      ON public.world_members (world_id, user_id, role);
  END IF;

  -- Composite index for entity queries by world and template
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entities') THEN
    CREATE INDEX IF NOT EXISTS idx_entities_world_template_name 
      ON public.entities (world_id, template_id, name);
  END IF;

  -- Composite index for folder hierarchy queries
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'folders') THEN
    CREATE INDEX IF NOT EXISTS idx_folders_world_parent 
      ON public.folders (world_id, parent_folder_id);
  END IF;

  -- Composite index for template queries by world and category
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'templates') THEN
    CREATE INDEX IF NOT EXISTS idx_templates_world_category_system 
      ON public.templates (world_id, category, is_system);
  END IF;

  -- Composite index for relationship queries
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'relationships') THEN
    CREATE INDEX IF NOT EXISTS idx_relationships_from_to_type 
      ON public.relationships (from_entity_id, to_entity_id, relationship_type);
  END IF;

  -- Composite index for activity logs with time-based queries
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_activity_logs_world_created_action 
      ON public.activity_logs (world_id, created_at DESC, action);
  END IF;

  -- Composite index for world invites by email and expiry
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'world_invites') THEN
    CREATE INDEX IF NOT EXISTS idx_world_invites_email_expires 
      ON public.world_invites (email, expires_at) WHERE accepted_at IS NULL;
  END IF;
END $$;

-- ================================
-- 5. OPTIMIZE EXISTING INDEXES
-- ================================

-- Add partial indexes for common filtered queries
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'worlds') THEN
    CREATE INDEX IF NOT EXISTS idx_worlds_public_active 
      ON public.worlds (updated_at DESC) WHERE is_public = TRUE AND is_archived = FALSE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entities') THEN
    CREATE INDEX IF NOT EXISTS idx_entities_active_by_world 
      ON public.entities (world_id, updated_at DESC) WHERE data IS NOT NULL;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'templates') THEN
    CREATE INDEX IF NOT EXISTS idx_templates_system_active 
      ON public.templates (name, category) WHERE is_system = TRUE;
  END IF;
END $$;

-- ================================
-- 6. ADD GIN INDEXES FOR JSONB AND ARRAY QUERIES
-- ================================

-- Add GIN indexes for JSONB and array queries
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entities') THEN
    CREATE INDEX IF NOT EXISTS idx_entities_data_gin 
      ON public.entities USING GIN (data);
    CREATE INDEX IF NOT EXISTS idx_entities_tags_gin 
      ON public.entities USING GIN (tags);
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'templates') THEN
    CREATE INDEX IF NOT EXISTS idx_templates_fields_gin 
      ON public.templates USING GIN (fields);
  END IF;

  -- Check if worlds table has extended array fields
  IF EXISTS (SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'worlds' AND column_name = 'genre_blend') THEN
    CREATE INDEX IF NOT EXISTS idx_worlds_arrays_gin 
      ON public.worlds USING GIN (genre_blend, key_themes, technology_level, magic_level, climate_biomes, conflict_drivers);
  END IF;
END $$;

-- ================================
-- 7. CREATE PERFORMANCE MONITORING VIEWS
-- ================================

-- View for monitoring index usage
CREATE OR REPLACE VIEW public.index_usage_stats AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC, idx_tup_read DESC;

-- View for monitoring table statistics
CREATE OR REPLACE VIEW public.table_stats AS
SELECT 
    schemaname,
    relname as tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- ================================
-- 8. ADD COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON FUNCTION public.user_can_edit_world(UUID) IS 'Checks if current user can edit the specified world (owner or editor/admin)';
COMMENT ON FUNCTION public.user_is_world_admin(UUID) IS 'Checks if current user is admin of the specified world (owner or admin member)';
COMMENT ON FUNCTION public.user_email_matches_invite(TEXT) IS 'Checks if current user email matches the provided invite email';
COMMENT ON FUNCTION public.user_has_world_access(UUID, UUID) IS 'Optimized function to check if user has access to world (owner, public, or member)';
COMMENT ON VIEW public.index_usage_stats IS 'Monitor index usage for performance optimization';
COMMENT ON VIEW public.table_stats IS 'Monitor table statistics for vacuum and analyze optimization';

-- ================================
-- 9. VERIFY SCHEMA CONSISTENCY
-- ================================

DO $$
DECLARE
    missing_funcs TEXT[] := ARRAY[]::TEXT[];
    func_name TEXT;
BEGIN
    -- Check for required functions
    FOR func_name IN SELECT unnest(ARRAY['user_can_edit_world', 'user_is_world_admin', 'user_email_matches_invite', 'user_has_world_access'])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE n.nspname = 'public' AND p.proname = func_name
        ) THEN
            missing_funcs := array_append(missing_funcs, func_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_funcs, 1) > 0 THEN
        RAISE WARNING 'Missing functions: %', array_to_string(missing_funcs, ', ');
    ELSE
        RAISE NOTICE 'All required helper functions are present';
    END IF;
END $$;