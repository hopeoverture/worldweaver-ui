-- Fix RLS policies for relationships table to allow admin operations

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow relationship creation for authenticated users" ON public.relationships;
DROP POLICY IF EXISTS "Allow relationship creation for world members" ON public.relationships;
DROP POLICY IF EXISTS "Allow relationship access for world members" ON public.relationships;
DROP POLICY IF EXISTS "Users can view relationships in accessible worlds" ON public.relationships;
DROP POLICY IF EXISTS "Users can create relationships in worlds they have access to" ON public.relationships;
DROP POLICY IF EXISTS "Users can update relationships in worlds they have access to" ON public.relationships;
DROP POLICY IF EXISTS "Users can delete relationships in worlds they have access to" ON public.relationships;

-- Create comprehensive RLS policies that work with admin client
CREATE POLICY "Allow relationship read access" ON public.relationships
  FOR SELECT USING (
    -- Allow if user has world access OR if this is an admin/service operation
    user_has_world_access(world_id, auth.uid()) OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Allow relationship creation" ON public.relationships
  FOR INSERT WITH CHECK (
    -- Allow if user has world access OR if this is an admin/service operation  
    user_has_world_access(world_id, auth.uid()) OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Allow relationship updates" ON public.relationships
  FOR UPDATE USING (
    -- Allow if user has world access OR if this is an admin/service operation
    user_has_world_access(world_id, auth.uid()) OR 
    auth.role() = 'service_role'
  ) WITH CHECK (
    -- Allow if user has world access OR if this is an admin/service operation
    user_has_world_access(world_id, auth.uid()) OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Allow relationship deletion" ON public.relationships
  FOR DELETE USING (
    -- Allow if user has world access OR if this is an admin/service operation
    user_has_world_access(world_id, auth.uid()) OR 
    auth.role() = 'service_role'
  );

-- Ensure RLS is enabled
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;