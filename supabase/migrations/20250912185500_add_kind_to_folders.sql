-- Add kind column to folders table to differentiate between entity and template folders
-- This resolves the issue where all folders were treated as 'entities' in the adapter

-- Add kind column with default value of 'entities' for existing folders
ALTER TABLE public.folders 
ADD COLUMN kind TEXT NOT NULL DEFAULT 'entities';

-- Add constraint to ensure only valid values
ALTER TABLE public.folders 
ADD CONSTRAINT folders_kind_check CHECK (kind IN ('entities', 'templates'));

-- Create index for performance when filtering by kind
CREATE INDEX idx_folders_kind ON public.folders (kind);

-- Update any existing folders that should be template folders
-- (This would need manual data migration if there are existing template folders)

-- Add comment for documentation
COMMENT ON COLUMN public.folders.kind IS 'The type of folder: entities or templates';