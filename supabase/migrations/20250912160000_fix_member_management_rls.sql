-- Fix RLS policies for world_members to allow admins to manage members

-- Drop existing member management policies
DROP POLICY IF EXISTS "world_member_insert_owner" ON public.world_members;
DROP POLICY IF EXISTS "world_member_update_owner" ON public.world_members;
DROP POLICY IF EXISTS "world_member_delete_owner" ON public.world_members;

-- Create new policies that allow both owners and admins to manage members
CREATE POLICY "world_member_insert_manage"
  ON public.world_members FOR INSERT
  WITH CHECK (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin')
    )
  );

CREATE POLICY "world_member_update_manage"
  ON public.world_members FOR UPDATE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin')
    )
  );

CREATE POLICY "world_member_delete_manage"
  ON public.world_members FOR DELETE
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE owner_id = (SELECT auth.uid())) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = (SELECT auth.uid()) AND role IN ('admin')
    )
  );