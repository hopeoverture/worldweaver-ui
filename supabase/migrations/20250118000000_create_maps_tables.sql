-- Migration: Create Maps Tables and Supporting Infrastructure
-- Description: Adds comprehensive mapping functionality with layers, markers, regions, paths, and labels
-- Date: 2025-01-18

-- Enable RLS for all tables
-- Note: RLS policies should be added based on your existing world access patterns

-- =============================================================================
-- CREATE ENUMS
-- =============================================================================

-- Map layer kinds
CREATE TYPE map_layer_kind AS ENUM (
  'markers',
  'regions',
  'paths',
  'labels',
  'fog',
  'gm'
);

-- =============================================================================
-- CREATE TABLES
-- =============================================================================

-- Maps table
CREATE TABLE public.maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_path TEXT, -- Path to uploaded map image file
  width_px INTEGER NOT NULL DEFAULT 1920, -- Map image width in pixels
  height_px INTEGER NOT NULL DEFAULT 1080, -- Map image height in pixels
  pixels_per_unit DECIMAL(10,4) DEFAULT 50.0, -- How many pixels = 1 world unit (for scaling)
  default_zoom DECIMAL(4,2) DEFAULT 1.0 CHECK (default_zoom > 0),
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Map layers table (for organizing different types of content)
CREATE TABLE public.map_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  kind map_layer_kind NOT NULL,
  z_index INTEGER NOT NULL DEFAULT 0, -- Display order (higher = on top)
  visible BOOLEAN NOT NULL DEFAULT true,
  style JSONB DEFAULT '{}', -- Layer-wide styling options
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure unique z_index per map for proper layering
  UNIQUE(map_id, z_index)
);

-- Map markers table (points of interest, entities, etc.)
CREATE TABLE public.map_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id UUID NOT NULL REFERENCES public.map_layers(id) ON DELETE CASCADE,
  x DECIMAL(12,4) NOT NULL, -- X coordinate in map units
  y DECIMAL(12,4) NOT NULL, -- Y coordinate in map units
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,
  icon VARCHAR(100), -- Icon name/type for display
  color VARCHAR(7) DEFAULT '#ef4444', -- Hex color code
  entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL, -- Optional link to entity
  metadata JSONB DEFAULT '{}', -- Additional marker data
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Map regions table (areas, zones, territories)
CREATE TABLE public.map_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id UUID NOT NULL REFERENCES public.map_layers(id) ON DELETE CASCADE,
  polygon JSONB NOT NULL, -- GeoJSON-style polygon coordinates
  style JSONB DEFAULT '{}', -- Styling for fill, stroke, opacity, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Validate polygon structure
  CHECK (jsonb_typeof(polygon) = 'object')
);

-- Map paths table (roads, rivers, borders, routes)
CREATE TABLE public.map_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id UUID NOT NULL REFERENCES public.map_layers(id) ON DELETE CASCADE,
  points JSONB NOT NULL, -- Array of [x, y] coordinate pairs
  style JSONB DEFAULT '{}', -- Styling for stroke, width, dash pattern, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Validate points structure
  CHECK (jsonb_typeof(points) = 'array')
);

-- Map labels table (text annotations)
CREATE TABLE public.map_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id UUID NOT NULL REFERENCES public.map_layers(id) ON DELETE CASCADE,
  x DECIMAL(12,4) NOT NULL, -- X coordinate in map units
  y DECIMAL(12,4) NOT NULL, -- Y coordinate in map units
  text TEXT NOT NULL,
  style JSONB DEFAULT '{}', -- Font, size, color, rotation, etc.
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- CREATE INDEXES
-- =============================================================================

-- Maps indexes
CREATE INDEX idx_maps_world_id ON public.maps(world_id);
CREATE INDEX idx_maps_created_by ON public.maps(created_by);
CREATE INDEX idx_maps_is_public ON public.maps(is_public);

-- Map layers indexes
CREATE INDEX idx_map_layers_map_id ON public.map_layers(map_id);
CREATE INDEX idx_map_layers_kind ON public.map_layers(kind);
CREATE INDEX idx_map_layers_visible ON public.map_layers(visible);

-- Map markers indexes
CREATE INDEX idx_map_markers_layer_id ON public.map_markers(layer_id);
CREATE INDEX idx_map_markers_entity_id ON public.map_markers(entity_id);
CREATE INDEX idx_map_markers_created_by ON public.map_markers(created_by);
CREATE INDEX idx_map_markers_coordinates ON public.map_markers(x, y);

-- Map regions indexes
CREATE INDEX idx_map_regions_layer_id ON public.map_regions(layer_id);
CREATE INDEX idx_map_regions_created_by ON public.map_regions(created_by);

-- Map paths indexes
CREATE INDEX idx_map_paths_layer_id ON public.map_paths(layer_id);
CREATE INDEX idx_map_paths_created_by ON public.map_paths(created_by);

-- Map labels indexes
CREATE INDEX idx_map_labels_layer_id ON public.map_labels(layer_id);
CREATE INDEX idx_map_labels_created_by ON public.map_labels(created_by);
CREATE INDEX idx_map_labels_coordinates ON public.map_labels(x, y);

-- =============================================================================
-- CREATE VIEWS
-- =============================================================================

-- View to easily query markers by map (joining through layers)
CREATE VIEW public.v_map_markers AS
SELECT
  mm.*,
  ml.map_id,
  ml.name AS layer_name,
  ml.kind AS layer_kind,
  ml.z_index AS layer_z_index,
  ml.visible AS layer_visible,
  e.name AS entity_name,
  e.template_id AS entity_template_id,
  t.name AS entity_template_name,
  m.name AS map_name,
  m.world_id
FROM public.map_markers mm
INNER JOIN public.map_layers ml ON mm.layer_id = ml.id
INNER JOIN public.maps m ON ml.map_id = m.id
LEFT JOIN public.entities e ON mm.entity_id = e.id
LEFT JOIN public.templates t ON e.template_id = t.id;

-- Create index on the view's map_id for fast filtering
CREATE INDEX idx_v_map_markers_map_id ON public.map_markers(layer_id);

-- =============================================================================
-- CREATE FUNCTIONS FOR UPDATED_AT TRIGGERS
-- =============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- CREATE TRIGGERS
-- =============================================================================

-- Triggers to automatically update updated_at timestamps
CREATE TRIGGER update_maps_updated_at
  BEFORE UPDATE ON public.maps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_map_layers_updated_at
  BEFORE UPDATE ON public.map_layers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_map_markers_updated_at
  BEFORE UPDATE ON public.map_markers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_map_regions_updated_at
  BEFORE UPDATE ON public.map_regions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_map_paths_updated_at
  BEFORE UPDATE ON public.map_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_map_labels_updated_at
  BEFORE UPDATE ON public.map_labels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables (policies should be added based on your existing patterns)
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_labels ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.maps IS 'World maps with image backgrounds and coordinate systems';
COMMENT ON TABLE public.map_layers IS 'Organizational layers for different types of map content';
COMMENT ON TABLE public.map_markers IS 'Point markers that can link to entities or be standalone';
COMMENT ON TABLE public.map_regions IS 'Polygon regions like territories, zones, or areas';
COMMENT ON TABLE public.map_paths IS 'Linear paths like roads, rivers, or routes';
COMMENT ON TABLE public.map_labels IS 'Text labels for map annotations';

COMMENT ON VIEW public.v_map_markers IS 'Convenient view joining markers with their map and entity information';

COMMENT ON COLUMN public.maps.pixels_per_unit IS 'Conversion factor: how many pixels equal one world unit for coordinate scaling';
COMMENT ON COLUMN public.maps.default_zoom IS 'Default zoom level when map is first loaded';
COMMENT ON COLUMN public.map_layers.z_index IS 'Display order - higher values appear on top';
COMMENT ON COLUMN public.map_markers.entity_id IS 'Optional link to an entity - enables clicking marker to open entity card';
COMMENT ON COLUMN public.map_regions.polygon IS 'GeoJSON-style polygon coordinates for the region boundary';
COMMENT ON COLUMN public.map_paths.points IS 'Array of [x, y] coordinate pairs defining the path';

-- Migration complete