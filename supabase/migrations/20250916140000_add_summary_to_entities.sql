-- Add summary column to entities table for AI-generated narrative summaries
ALTER TABLE public.entities
ADD COLUMN summary text;

-- Add index for faster summary searches if needed in the future
CREATE INDEX IF NOT EXISTS idx_entities_summary_search ON public.entities USING gin(to_tsvector('english', summary))
WHERE summary IS NOT NULL;

-- Add a comment to document the purpose
COMMENT ON COLUMN public.entities.summary IS 'AI-generated narrative summary that synthesizes all entity field data into coherent prose';