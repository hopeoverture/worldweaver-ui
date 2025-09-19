-- Migration: Create Maps Storage Bucket and Policies
-- Description: Sets up Supabase Storage for map images with world-scoped access
-- Date: 2025-01-18

-- =============================================================================
-- CREATE STORAGE BUCKET
-- =============================================================================

-- Create the maps bucket (private by default)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'maps',
  'maps',
  false, -- Private bucket
  10485760, -- 10MB file size limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- CREATE STORAGE POLICIES
-- =============================================================================

-- Policy: Allow world editors to SELECT (read) map files for their worlds
CREATE POLICY "World editors can read their world maps" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'maps' AND
    -- Extract worldId from path: maps/worlds/{worldId}/{mapId}/base.png
    (
      -- Allow if user has world access OR if this is a service operation
      user_has_world_access(
        (string_to_array(name, '/'))[3]::uuid,
        auth.uid()
      ) OR
      auth.role() = 'service_role'
    )
  );

-- Policy: Allow world editors to INSERT (upload) map files for their worlds
CREATE POLICY "World editors can upload to their world maps" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'maps' AND
    -- Validate path structure: maps/worlds/{worldId}/{mapId}/filename
    array_length(string_to_array(name, '/'), 1) >= 4 AND
    (string_to_array(name, '/'))[1] = 'maps' AND
    (string_to_array(name, '/'))[2] = 'worlds' AND
    -- Check that the worldId in path is a valid UUID
    (string_to_array(name, '/'))[3] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND
    -- Check user has world access
    (
      user_has_world_access(
        (string_to_array(name, '/'))[3]::uuid,
        auth.uid()
      ) OR
      auth.role() = 'service_role'
    )
  );

-- Policy: Allow world editors to UPDATE map files for their worlds
CREATE POLICY "World editors can update their world maps" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'maps' AND
    -- Extract worldId from path and check access
    (
      user_has_world_access(
        (string_to_array(name, '/'))[3]::uuid,
        auth.uid()
      ) OR
      auth.role() = 'service_role'
    )
  ) WITH CHECK (
    bucket_id = 'maps' AND
    -- Validate path structure on update
    array_length(string_to_array(name, '/'), 1) >= 4 AND
    (string_to_array(name, '/'))[1] = 'maps' AND
    (string_to_array(name, '/'))[2] = 'worlds' AND
    (string_to_array(name, '/'))[3] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND
    -- Check user has world access
    (
      user_has_world_access(
        (string_to_array(name, '/'))[3]::uuid,
        auth.uid()
      ) OR
      auth.role() = 'service_role'
    )
  );

-- Policy: Allow world editors to DELETE map files for their worlds
CREATE POLICY "World editors can delete their world maps" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'maps' AND
    -- Extract worldId from path and check access
    (
      user_has_world_access(
        (string_to_array(name, '/'))[3]::uuid,
        auth.uid()
      ) OR
      auth.role() = 'service_role'
    )
  );

-- Storage setup complete