-- Add folder support to templates table
-- This allows templates to be organized in folders just like entities

-- Add folder_id column to templates table
ALTER TABLE public.templates 
ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- Add index for performance on folder queries
CREATE INDEX idx_templates_folder_id ON public.templates(folder_id);

-- Update the updated_at trigger to include the new column
-- (No need to recreate trigger as it works on all columns)

-- Allow templates to reference folders in their world
-- RLS policies will handle access control via existing folder policies