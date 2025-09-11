-- Fix world_files table field consistency
-- This migration renames file_type to mime_type to match the generated types expectation

-- Add mime_type column if it doesn't exist
ALTER TABLE world_files ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- Copy data from file_type to mime_type if file_type exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'world_files' AND column_name = 'file_type') THEN
        UPDATE world_files SET mime_type = file_type WHERE mime_type IS NULL AND file_type IS NOT NULL;
        ALTER TABLE world_files DROP COLUMN file_type;
    END IF;
END $$;

-- Ensure the column exists with proper constraints
ALTER TABLE world_files ALTER COLUMN mime_type SET DEFAULT NULL;

-- Update RLS policies if they reference the old column name
-- (No existing policies reference file_type, so no changes needed)