-- Migration: Create RLS Policies for Maps Tables
-- Description: Adds Row Level Security policies based on world access patterns
-- Date: 2025-01-18

-- =============================================================================
-- RLS POLICIES FOR MAPS TABLE
-- =============================================================================

CREATE POLICY "Allow maps read access" ON public.maps
  FOR SELECT USING (
    -- Allow if user has world access OR if this is an admin/service operation
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Allow maps creation" ON public.maps
  FOR INSERT WITH CHECK (
    -- Allow if user has world access OR if this is an admin/service operation
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Allow maps updates" ON public.maps
  FOR UPDATE USING (
    -- Allow if user has world access OR if this is an admin/service operation
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
  ) WITH CHECK (
    -- Allow if user has world access OR if this is an admin/service operation
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Allow maps deletion" ON public.maps
  FOR DELETE USING (
    -- Allow if user has world access OR if this is an admin/service operation
    user_has_world_access(world_id, auth.uid()) OR
    auth.role() = 'service_role'
  );

-- =============================================================================
-- RLS POLICIES FOR MAP_LAYERS TABLE
-- =============================================================================

CREATE POLICY "Allow map_layers read access" ON public.map_layers
  FOR SELECT USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.maps m
      WHERE m.id = map_layers.map_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_layers creation" ON public.map_layers
  FOR INSERT WITH CHECK (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.maps m
      WHERE m.id = map_layers.map_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_layers updates" ON public.map_layers
  FOR UPDATE USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.maps m
      WHERE m.id = map_layers.map_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  ) WITH CHECK (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.maps m
      WHERE m.id = map_layers.map_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_layers deletion" ON public.map_layers
  FOR DELETE USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.maps m
      WHERE m.id = map_layers.map_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

-- =============================================================================
-- RLS POLICIES FOR MAP_MARKERS TABLE
-- =============================================================================

CREATE POLICY "Allow map_markers read access" ON public.map_markers
  FOR SELECT USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_markers.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_markers creation" ON public.map_markers
  FOR INSERT WITH CHECK (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_markers.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_markers updates" ON public.map_markers
  FOR UPDATE USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_markers.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  ) WITH CHECK (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_markers.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_markers deletion" ON public.map_markers
  FOR DELETE USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_markers.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

-- =============================================================================
-- RLS POLICIES FOR MAP_REGIONS TABLE
-- =============================================================================

CREATE POLICY "Allow map_regions read access" ON public.map_regions
  FOR SELECT USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_regions.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_regions creation" ON public.map_regions
  FOR INSERT WITH CHECK (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_regions.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_regions updates" ON public.map_regions
  FOR UPDATE USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_regions.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  ) WITH CHECK (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_regions.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_regions deletion" ON public.map_regions
  FOR DELETE USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_regions.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

-- =============================================================================
-- RLS POLICIES FOR MAP_PATHS TABLE
-- =============================================================================

CREATE POLICY "Allow map_paths read access" ON public.map_paths
  FOR SELECT USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_paths.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_paths creation" ON public.map_paths
  FOR INSERT WITH CHECK (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_paths.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_paths updates" ON public.map_paths
  FOR UPDATE USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_paths.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  ) WITH CHECK (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_paths.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_paths deletion" ON public.map_paths
  FOR DELETE USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_paths.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

-- =============================================================================
-- RLS POLICIES FOR MAP_LABELS TABLE
-- =============================================================================

CREATE POLICY "Allow map_labels read access" ON public.map_labels
  FOR SELECT USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_labels.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_labels creation" ON public.map_labels
  FOR INSERT WITH CHECK (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_labels.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_labels updates" ON public.map_labels
  FOR UPDATE USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_labels.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  ) WITH CHECK (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_labels.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Allow map_labels deletion" ON public.map_labels
  FOR DELETE USING (
    -- Allow if user has world access to the parent map OR if this is an admin/service operation
    EXISTS (
      SELECT 1 FROM public.map_layers ml
      INNER JOIN public.maps m ON ml.map_id = m.id
      WHERE ml.id = map_labels.layer_id
      AND (user_has_world_access(m.world_id, auth.uid()) OR auth.role() = 'service_role')
    )
  );

-- RLS policies migration complete