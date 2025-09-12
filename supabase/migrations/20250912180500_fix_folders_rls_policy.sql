-- Fix folders RLS policy to allow service_role operations
-- This resolves 500 errors when creating folders in production

DROP POLICY IF EXISTS "Users can create folders in editable worlds" ON public.folders;
CREATE POLICY "Users can create folders in editable worlds"
  ON public.folders FOR INSERT
  WITH CHECK (
    -- Allow service_role to bypass RLS for admin operations
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    -- Regular user access checks
    (
      world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
      world_id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
      )
    )
  );

DROP POLICY IF EXISTS "Users can update folders in editable worlds" ON public.folders;
CREATE POLICY "Users can update folders in editable worlds"
  ON public.folders FOR UPDATE
  USING (
    -- Allow service_role to bypass RLS for admin operations
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    -- Regular user access checks
    (
      world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
      world_id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete folders in editable worlds" ON public.folders;
CREATE POLICY "Users can delete folders in editable worlds"
  ON public.folders FOR DELETE
  USING (
    -- Allow service_role to bypass RLS for admin operations
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    -- Regular user access checks
    (
      world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
      world_id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
      )
    )
  );