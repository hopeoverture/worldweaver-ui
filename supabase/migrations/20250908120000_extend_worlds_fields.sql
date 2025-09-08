-- Extend public.worlds with structured fields used during world creation
-- Safe to run multiple times (IF NOT EXISTS guards)

ALTER TABLE public.worlds
  ADD COLUMN IF NOT EXISTS logline TEXT,
  ADD COLUMN IF NOT EXISTS genre_blend TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS overall_tone TEXT,
  ADD COLUMN IF NOT EXISTS key_themes TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS audience_rating TEXT,
  ADD COLUMN IF NOT EXISTS scope_scale TEXT,
  ADD COLUMN IF NOT EXISTS technology_level TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS magic_level TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS cosmology_model TEXT,
  ADD COLUMN IF NOT EXISTS climate_biomes TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS calendar_timekeeping TEXT,
  ADD COLUMN IF NOT EXISTS societal_overview TEXT,
  ADD COLUMN IF NOT EXISTS conflict_drivers TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS rules_constraints TEXT,
  ADD COLUMN IF NOT EXISTS aesthetic_direction TEXT;

-- Optional: lightweight indexes for common filters (uncomment if needed)
-- CREATE INDEX IF NOT EXISTS idx_worlds_overall_tone ON public.worlds (overall_tone);
-- CREATE INDEX IF NOT EXISTS idx_worlds_audience_rating ON public.worlds (audience_rating);
-- CREATE INDEX IF NOT EXISTS idx_worlds_scope_scale ON public.worlds (scope_scale);

COMMENT ON COLUMN public.worlds.logline IS 'One-line premise for the world';
COMMENT ON COLUMN public.worlds.genre_blend IS 'Primary genres associated with the world';
COMMENT ON COLUMN public.worlds.overall_tone IS 'Overall tone (e.g., Bright, Dark)';
COMMENT ON COLUMN public.worlds.key_themes IS 'Key thematic elements';
COMMENT ON COLUMN public.worlds.audience_rating IS 'Intended audience (e.g., Teen, Mature)';
COMMENT ON COLUMN public.worlds.scope_scale IS 'Narrative/setting scope (e.g., Planetary)';
COMMENT ON COLUMN public.worlds.technology_level IS 'Technology levels present';
COMMENT ON COLUMN public.worlds.magic_level IS 'Magic levels present';
COMMENT ON COLUMN public.worlds.cosmology_model IS 'Cosmology description/model';
COMMENT ON COLUMN public.worlds.climate_biomes IS 'Dominant climates/biomes';
COMMENT ON COLUMN public.worlds.calendar_timekeeping IS 'Calendar and timekeeping overview';
COMMENT ON COLUMN public.worlds.societal_overview IS 'Societal structure overview';
COMMENT ON COLUMN public.worlds.conflict_drivers IS 'Primary drivers of conflict';
COMMENT ON COLUMN public.worlds.rules_constraints IS 'Rules or constraints governing the setting';
COMMENT ON COLUMN public.worlds.aesthetic_direction IS 'Aesthetic/style direction';

