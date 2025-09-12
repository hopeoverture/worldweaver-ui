-- Rollback Database Performance Optimizations
-- This migration reverts all changes made in 20250111140000_optimize_database_performance.sql

-- ================================
-- 1. DROP PERFORMANCE MONITORING VIEWS
-- ================================

DROP VIEW IF EXISTS public.table_stats;
DROP VIEW IF EXISTS public.index_usage_stats;

-- ================================
-- 2. DROP GIN INDEXES
-- ================================

DROP INDEX IF EXISTS public.idx_worlds_arrays_gin;
DROP INDEX IF EXISTS public.idx_entities_tags_gin;
DROP INDEX IF EXISTS public.idx_templates_fields_gin;
DROP INDEX IF EXISTS public.idx_entities_data_gin;

-- ================================
-- 3. DROP PARTIAL INDEXES
-- ================================

DROP INDEX IF EXISTS public.idx_templates_system_active;
DROP INDEX IF EXISTS public.idx_entities_active_by_world;
DROP INDEX IF EXISTS public.idx_worlds_public_active;

-- ================================
-- 4. DROP COMPOSITE INDEXES
-- ================================

DROP INDEX IF EXISTS public.idx_world_invites_email_expires;
DROP INDEX IF EXISTS public.idx_activity_logs_world_created_action;
DROP INDEX IF EXISTS public.idx_relationships_from_to_type;
DROP INDEX IF EXISTS public.idx_templates_world_category_system;
DROP INDEX IF EXISTS public.idx_folders_world_parent;
DROP INDEX IF EXISTS public.idx_entities_world_template_name;
DROP INDEX IF EXISTS public.idx_world_members_world_user_role;
DROP INDEX IF EXISTS public.idx_worlds_owner_public_archived;

-- ================================
-- 5. REVERT FUNCTION OPTIMIZATIONS
-- ================================

-- Revert user_has_world_access to original implementation
CREATE OR REPLACE FUNCTION public.user_has_world_access(world_uuid UUID, user_uuid UUID)
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

-- ================================
-- 6. DROP NEW HELPER FUNCTIONS
-- ================================

-- Note: Functions may have policy dependencies - dropping with CASCADE
DROP FUNCTION IF EXISTS public.user_has_world_access(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.user_email_matches_invite(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.user_is_world_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.user_can_edit_world(UUID) CASCADE;

-- ================================
-- 7. REMOVE COMMENTS
-- ================================

COMMENT ON FUNCTION public.user_has_world_access(UUID, UUID) IS NULL;

-- ================================
-- 8. VERIFICATION
-- ================================

DO $$
DECLARE
    extra_funcs TEXT[] := ARRAY[]::TEXT[];
    func_name TEXT;
BEGIN
    -- Check that optimization functions were removed
    FOR func_name IN SELECT unnest(ARRAY['user_can_edit_world', 'user_is_world_admin', 'user_email_matches_invite'])
    LOOP
        IF EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE n.nspname = 'public' AND p.proname = func_name
        ) THEN
            extra_funcs := array_append(extra_funcs, func_name);
        END IF;
    END LOOP;
    
    IF array_length(extra_funcs, 1) > 0 THEN
        RAISE WARNING 'Functions not properly removed: %', array_to_string(extra_funcs, ', ');
    ELSE
        RAISE NOTICE 'All optimization functions successfully removed';
    END IF;
    
    -- Verify original user_has_world_access still exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'user_has_world_access'
          AND p.pronargs = 2  -- Two parameters
    ) THEN
        RAISE WARNING 'Original user_has_world_access function missing';
    ELSE
        RAISE NOTICE 'Original user_has_world_access function restored';
    END IF;
END $$;