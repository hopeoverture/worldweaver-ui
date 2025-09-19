-- Migration: Add Map Generation Preference Fields
-- Description: Adds comprehensive map generation fields to store AI generation preferences
-- Date: 2025-01-18

-- =============================================================================
-- CREATE ENUMS FOR MAP GENERATION FIELDS
-- =============================================================================

-- Map purpose enum
CREATE TYPE map_purpose AS ENUM (
  'campaign_overview',        -- Campaign overview / world atlas
  'regional_adventuring',     -- Regional adventuring (quests & travel)
  'local_exploration',        -- Local exploration (hex crawl)
  'political_boundaries',     -- Political boundaries & factions
  'trade_logistics',          -- Trade & logistics
  'war_operations'            -- War & military operations
);

-- Map scale enum
CREATE TYPE map_scale AS ENUM (
  'world_continent',          -- World / continent
  'large_region',             -- Large region (500–1500 km)
  'province_kingdom',         -- Province / kingdom (150–500 km)
  'local_area',               -- Local area (25–150 km)
  'town_surroundings'         -- Town + surroundings (1–25 km)
);

-- Settlement density and tech level enum
CREATE TYPE settlement_density AS ENUM (
  'sparse_nomadic',           -- Sparse nomadic / pre-agrarian
  'rural_agrarian',           -- Rural agrarian with few towns
  'feudal_kingdoms',          -- Feudal kingdoms with walled cities
  'late_medieval',            -- Late-medieval / early gunpowder
  'early_industrial'          -- Early industrial / steampunk
);

-- Political complexity enum
CREATE TYPE political_complexity AS ENUM (
  'minimal',                  -- Minimal (1–2 realms)
  'moderate',                 -- Moderate (3–6 realms)
  'high'                      -- High (7+ realms, enclaves, vassals)
);

-- Map visual style enum
CREATE TYPE map_visual_style AS ENUM (
  'inked_atlas',              -- Inked atlas (lines & hatching)
  'painterly',                -- Painterly/illustrated
  'hex_map',                  -- Hex map (grid & symbols)
  'minimal_modern',           -- Minimal modern
  'nautical_chart'            -- Nautical chart
);

-- =============================================================================
-- ADD NEW COLUMNS TO MAPS TABLE
-- =============================================================================

-- Add map generation preference columns
ALTER TABLE public.maps ADD COLUMN map_purpose map_purpose;
ALTER TABLE public.maps ADD COLUMN map_scale map_scale;
ALTER TABLE public.maps ADD COLUMN genre_tags TEXT[];
ALTER TABLE public.maps ADD COLUMN terrain_emphasis TEXT[];
ALTER TABLE public.maps ADD COLUMN climate_zones TEXT[];
ALTER TABLE public.maps ADD COLUMN settlement_density settlement_density;
ALTER TABLE public.maps ADD COLUMN political_complexity political_complexity;
ALTER TABLE public.maps ADD COLUMN travel_focus TEXT[];
ALTER TABLE public.maps ADD COLUMN signature_features TEXT[];
ALTER TABLE public.maps ADD COLUMN visual_style map_visual_style;

-- Add generation metadata
ALTER TABLE public.maps ADD COLUMN generation_prompt TEXT;
ALTER TABLE public.maps ADD COLUMN generation_settings JSONB DEFAULT '{}';

-- =============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN public.maps.map_purpose IS 'Primary intended use of the map for gameplay or narrative';
COMMENT ON COLUMN public.maps.map_scale IS 'Geographic scale and scope of the map';
COMMENT ON COLUMN public.maps.genre_tags IS 'Array of genre elements that influence map style and content';
COMMENT ON COLUMN public.maps.terrain_emphasis IS 'Array of terrain types to emphasize in generation';
COMMENT ON COLUMN public.maps.climate_zones IS 'Array of climate zones expected across the map';
COMMENT ON COLUMN public.maps.settlement_density IS 'Settlement density and technological development level';
COMMENT ON COLUMN public.maps.political_complexity IS 'Level of political division and complexity to show';
COMMENT ON COLUMN public.maps.travel_focus IS 'Array of transportation and travel methods to emphasize';
COMMENT ON COLUMN public.maps.signature_features IS 'Array of unique geographical or architectural features to include';
COMMENT ON COLUMN public.maps.visual_style IS 'Artistic and cartographic style for the map rendering';
COMMENT ON COLUMN public.maps.generation_prompt IS 'The final AI prompt used to generate this map';
COMMENT ON COLUMN public.maps.generation_settings IS 'Additional generation settings and metadata';

-- =============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Indexes for filtering maps by generation properties
CREATE INDEX idx_maps_purpose ON public.maps(map_purpose);
CREATE INDEX idx_maps_scale ON public.maps(map_scale);
CREATE INDEX idx_maps_settlement_density ON public.maps(settlement_density);
CREATE INDEX idx_maps_political_complexity ON public.maps(political_complexity);
CREATE INDEX idx_maps_visual_style ON public.maps(visual_style);

-- GIN indexes for array fields to enable efficient array searching
CREATE INDEX idx_maps_genre_tags ON public.maps USING GIN(genre_tags);
CREATE INDEX idx_maps_terrain_emphasis ON public.maps USING GIN(terrain_emphasis);
CREATE INDEX idx_maps_climate_zones ON public.maps USING GIN(climate_zones);
CREATE INDEX idx_maps_travel_focus ON public.maps USING GIN(travel_focus);
CREATE INDEX idx_maps_signature_features ON public.maps USING GIN(signature_features);

-- GIN index for generation settings JSONB
CREATE INDEX idx_maps_generation_settings ON public.maps USING GIN(generation_settings);

-- Migration complete