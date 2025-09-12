-- Remove the redundant user_id column from worlds table
-- The table should only use owner_id for consistency

ALTER TABLE public.worlds DROP COLUMN IF EXISTS user_id;
