-- Migration to trigger type regeneration for missing data JSONB fields
-- This doesn't change the database schema but serves as a marker
-- The actual fix requires regenerating types.generated.ts

-- Verify the data columns exist (they should from previous migrations)
DO $$
BEGIN
    -- Check profiles.data exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'data') THEN
        RAISE EXCEPTION 'profiles.data column is missing - run migration 20250908235000_add_data_jsonb_to_folders_profiles.sql first';
    END IF;
    
    -- Check folders.data exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'folders' AND column_name = 'data') THEN
        RAISE EXCEPTION 'folders.data column is missing - run migration 20250908235000_add_data_jsonb_to_folders_profiles.sql first';
    END IF;
    
    RAISE NOTICE 'All data JSONB columns verified. Please regenerate types.generated.ts using: npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/lib/supabase/types.generated.ts';
END $$;