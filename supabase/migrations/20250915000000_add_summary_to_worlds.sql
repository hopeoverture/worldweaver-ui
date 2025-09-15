-- Add summary field to worlds table for better content organization
-- This field will be distinct from logline, allowing for both brief summaries and compelling one-liners

-- Add summary column to worlds table
ALTER TABLE public.worlds
ADD COLUMN summary TEXT;

-- Copy existing logline data to summary for backward compatibility
-- This ensures existing worlds have content in the new summary field
UPDATE public.worlds
SET summary = logline
WHERE logline IS NOT NULL AND logline != '';

-- Add comment to document the purpose
COMMENT ON COLUMN public.worlds.summary IS 'Brief overview of the world, its key characteristics, and what makes it unique. Distinct from logline which is a compelling one-sentence description.';

-- Create index for performance on summary searches (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_worlds_summary ON public.worlds USING gin(to_tsvector('english', summary)) WHERE summary IS NOT NULL;