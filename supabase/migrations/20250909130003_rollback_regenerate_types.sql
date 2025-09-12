-- Rollback migration for type regeneration marker
-- This is a no-op rollback since the original migration didn't change schema

DO $$
BEGIN
    RAISE NOTICE 'Type regeneration rollback complete. No schema changes to revert.';
    RAISE NOTICE 'If you need to revert to old types, restore the previous version of types.generated.ts from git.';
END $$;