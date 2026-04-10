-- Add ghost_tags column to videos table.
-- Ghost tags are AI-generated internal search tags — never shown publicly.
-- Generated from title + description + creator's own public tags at save time.
ALTER TABLE public.videos
  ADD COLUMN ghost_tags text[] DEFAULT '{}';
