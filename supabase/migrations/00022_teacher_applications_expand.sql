-- ============================================================
-- JungleGym — Expand teacher_applications with richer fields
-- ============================================================
-- Adds social links, movement taxonomy, demo video pointer.
-- reviewed_by / reviewed_at already exist from 00005.
-- demo_video_url stays nullable for backfill compatibility; the
-- application UI enforces "required" client-side.

ALTER TABLE public.teacher_applications
  ADD COLUMN IF NOT EXISTS instagram_url   TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url     TEXT,
  ADD COLUMN IF NOT EXISTS movement_types  TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS other_movement  TEXT,
  ADD COLUMN IF NOT EXISTS demo_video_url  TEXT;
