-- Add folder_id column to templates table for template folder organization
-- This enables templates to be organized into template folders (where kind = 'templates')

-- Add the folder_id column
ALTER TABLE public.templates
ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- Add index for performance on folder queries
CREATE INDEX idx_templates_folder_id ON public.templates(folder_id);

-- Add a comment to document the purpose
COMMENT ON COLUMN public.templates.folder_id IS 'References folders table for template organization. Only templates folders (kind = templates) should be used.';