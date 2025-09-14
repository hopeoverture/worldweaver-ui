-- Fix templates UPDATE policy to handle system templates
-- Issue: System templates (world_id IS NULL) cannot be updated because RLS policy
-- only checks user_has_world_access(world_id, auth.uid()) without handling NULL world_id

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update templates in editable worlds" ON public.templates;

-- Create new UPDATE policy that handles system templates
CREATE POLICY "Users can update templates in editable worlds" ON public.templates
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
    -- Allow updates to system templates (for folder assignment, etc.)
    world_id IS NULL OR
    -- Allow updates to world templates with proper access
    user_has_world_access(world_id, auth.uid()) OR
    -- Allow service role operations
    auth.role() = 'service_role'
) WITH CHECK (
    -- Same conditions for WITH CHECK constraint
    world_id IS NULL OR
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
);

-- Also fix entity UPDATE policy to be consistent
DROP POLICY IF EXISTS "Users can update entities in editable worlds" ON public.entities;

CREATE POLICY "Users can update entities in editable worlds" ON public.entities
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
    -- Entities always have world_id, so no NULL check needed
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
) WITH CHECK (
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
);