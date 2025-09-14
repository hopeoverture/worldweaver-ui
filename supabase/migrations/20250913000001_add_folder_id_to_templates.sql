-- Add folder_id column to templates table for template folder organization
-- This enables templates to be organized into template folders

ALTER TABLE public.templates
ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- Add index for performance on folder queries
CREATE INDEX idx_templates_folder_id ON public.templates(folder_id);

-- Add constraint to ensure templates can only be placed in template folders
-- This will be enforced at application level since we can't easily add cross-table constraints
-- Templates should only be moved to folders where kind = 'templates'

-- Update any existing templates to have NULL folder_id (ungrouped)
-- No action needed as new column defaults to NULL