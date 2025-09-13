-- Restore missing RLS policies for entity and template updates

-- Entity update policy
CREATE POLICY "Users can update entities in editable worlds" ON "public"."entities"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
) WITH CHECK (
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
);

-- Entity delete policy
CREATE POLICY "Users can delete entities in editable worlds" ON "public"."entities"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
);

-- Template update policy
CREATE POLICY "Users can update templates in editable worlds" ON "public"."templates"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
) WITH CHECK (
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
);

-- Template delete policy
CREATE POLICY "Users can delete templates in editable worlds" ON "public"."templates"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
);

-- Relationship update policy (may already exist from recent migration)
CREATE POLICY "Users can update relationships in editable worlds" ON "public"."relationships"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
) WITH CHECK (
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
);

-- Relationship delete policy (may already exist from recent migration)
CREATE POLICY "Users can delete relationships in editable worlds" ON "public"."relationships"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
);