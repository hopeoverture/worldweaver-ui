-- Rollback world_files table field consistency fix
-- This migration reverts mime_type back to file_type

-- Add file_type column if it doesn't exist
ALTER TABLE world_files ADD COLUMN IF NOT EXISTS file_type TEXT;

-- Copy data from mime_type to file_type if mime_type exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'world_files' AND column_name = 'mime_type') THEN
        UPDATE world_files SET file_type = mime_type WHERE file_type IS NULL AND mime_type IS NOT NULL;
        ALTER TABLE world_files DROP COLUMN mime_type;
    END IF;
END $$;

-- Ensure the column exists with proper constraints
ALTER TABLE world_files ALTER COLUMN file_type SET DEFAULT NULL;