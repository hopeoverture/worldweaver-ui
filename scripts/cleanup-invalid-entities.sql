-- Cleanup script to identify and delete entities with invalid folder references
-- This script will find entities that reference non-existent folders

-- First, let's see what we're dealing with
-- Show all entities with their folder references
SELECT
    e.id as entity_id,
    e.name as entity_name,
    e.world_id,
    e.folder_id,
    f.id as actual_folder_id,
    f.name as folder_name,
    f.kind as folder_kind,
    CASE
        WHEN e.folder_id IS NULL THEN 'ungrouped'
        WHEN f.id IS NULL THEN 'INVALID_FOLDER'
        WHEN f.kind != 'entities' THEN 'WRONG_FOLDER_TYPE'
        ELSE 'valid'
    END as status
FROM entities e
LEFT JOIN folders f ON e.folder_id = f.id
ORDER BY e.world_id, status;

-- Count entities by status
SELECT
    CASE
        WHEN e.folder_id IS NULL THEN 'ungrouped'
        WHEN f.id IS NULL THEN 'INVALID_FOLDER'
        WHEN f.kind != 'entities' THEN 'WRONG_FOLDER_TYPE'
        ELSE 'valid'
    END as status,
    COUNT(*) as count
FROM entities e
LEFT JOIN folders f ON e.folder_id = f.id
GROUP BY status
ORDER BY status;

-- Show entities that need to be cleaned up
SELECT
    e.id,
    e.name,
    e.world_id,
    e.folder_id,
    'Entity references non-existent folder' as issue
FROM entities e
LEFT JOIN folders f ON e.folder_id = f.id
WHERE e.folder_id IS NOT NULL AND f.id IS NULL;

-- Show entities in wrong folder types
SELECT
    e.id,
    e.name,
    e.world_id,
    e.folder_id,
    f.kind,
    'Entity in non-entity folder' as issue
FROM entities e
JOIN folders f ON e.folder_id = f.id
WHERE f.kind != 'entities';

-- DELETE OPERATIONS (uncomment to execute)
-- Note: This will delete entities with invalid folder references

-- Delete entities that reference non-existent folders
-- DELETE FROM entities
-- WHERE id IN (
--     SELECT e.id
--     FROM entities e
--     LEFT JOIN folders f ON e.folder_id = f.id
--     WHERE e.folder_id IS NOT NULL AND f.id IS NULL
-- );

-- Alternative: Set folder_id to NULL for entities in invalid folders (make them ungrouped)
-- UPDATE entities
-- SET folder_id = NULL
-- WHERE id IN (
--     SELECT e.id
--     FROM entities e
--     LEFT JOIN folders f ON e.folder_id = f.id
--     WHERE e.folder_id IS NOT NULL AND f.id IS NULL
-- );

-- Delete entities in wrong folder types (entities in template folders)
-- DELETE FROM entities
-- WHERE id IN (
--     SELECT e.id
--     FROM entities e
--     JOIN folders f ON e.folder_id = f.id
--     WHERE f.kind != 'entities'
-- );