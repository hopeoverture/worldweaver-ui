-- Fix field consistency across the application stack
-- This migration ensures the database schema matches the application code

-- Ensure user_id column is completely removed from worlds table
ALTER TABLE public.worlds DROP COLUMN IF EXISTS user_id;

-- Ensure owner_id is properly indexed for performance
CREATE INDEX IF NOT EXISTS idx_worlds_owner_id ON public.worlds (owner_id);

-- Ensure all extended world fields exist (already created in previous migration)
-- This is idempotent - safe to run multiple times
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

-- Update RLS policies to use owner_id instead of user_id
-- Note: This assumes RLS policies exist and may need adjustment based on actual policies

-- Add comment to document the field consistency fix
COMMENT ON TABLE public.worlds IS 'Worlds table - uses owner_id for ownership, user_id field removed for consistency';

-- Verify the schema is consistent
DO $$
BEGIN
  -- Check that user_id column doesn't exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'worlds' 
    AND column_name = 'user_id' 
    AND table_schema = 'public'
  ) THEN
    RAISE WARNING 'user_id column still exists in worlds table - manual cleanup required';
  END IF;
  
  -- Check that owner_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'worlds' 
    AND column_name = 'owner_id' 
    AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'owner_id column missing from worlds table';
  END IF;
END $$;