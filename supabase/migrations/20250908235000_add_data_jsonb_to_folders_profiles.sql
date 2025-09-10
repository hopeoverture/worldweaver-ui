-- Migration: Add data JSONB columns to folders and profiles
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
