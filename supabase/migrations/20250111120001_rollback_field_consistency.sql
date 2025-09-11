-- Rollback migration for field consistency fixes
-- This reverses the changes made in 20250111120000_fix_field_consistency.sql

-- WARNING: This rollback will restore user_id column but data may be inconsistent
-- Only use this if you need to revert for debugging purposes

-- Restore user_id column (will be NULL for existing records)
ALTER TABLE public.worlds ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Copy owner_id values to user_id for data consistency
UPDATE public.worlds SET user_id = owner_id WHERE user_id IS NULL;

-- Remove the index we added
DROP INDEX IF EXISTS idx_worlds_owner_id;

-- Remove the table comment
COMMENT ON TABLE public.worlds IS NULL;

-- Note: The extended fields are left in place as they are part of the application functionality
-- and removing them would cause data loss

RAISE NOTICE 'Rollback complete - user_id column restored with owner_id values';