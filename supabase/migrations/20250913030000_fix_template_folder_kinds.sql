-- Fix template folder kinds for existing folders
-- This migration identifies folders that contain templates and sets their kind to 'templates'

-- Update folders that have templates associated with them
UPDATE folders 
SET kind = 'templates'
WHERE id IN (
  SELECT DISTINCT folder_id 
  FROM templates 
  WHERE folder_id IS NOT NULL
)
AND (kind IS NULL OR kind = 'entities');

-- Ensure all other folders default to 'entities' kind
UPDATE folders 
SET kind = 'entities'
WHERE kind IS NULL;

-- Add a comment for future reference
COMMENT ON COLUMN folders.kind IS 'Type of folder: entities or templates. Determined by content type it contains.';