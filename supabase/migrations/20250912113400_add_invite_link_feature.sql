-- Add invite link functionality to worlds
-- This adds the invite_link_enabled field to control whether a world allows invite links

ALTER TABLE public.worlds 
ADD COLUMN invite_link_enabled BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.worlds.invite_link_enabled IS 'Whether this world allows people to join via shareable invite links';