-- Add Cloudflare Stream columns to live_sessions
-- Run manually in Supabase SQL editor

ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS cf_input_id    TEXT,
  ADD COLUMN IF NOT EXISTS cf_stream_key  TEXT,
  ADD COLUMN IF NOT EXISTS cf_playback_id TEXT;

COMMENT ON COLUMN public.live_sessions.cf_input_id IS 'Cloudflare Stream live input UID';
COMMENT ON COLUMN public.live_sessions.cf_stream_key IS 'RTMPS stream key — only expose to the session creator';
COMMENT ON COLUMN public.live_sessions.cf_playback_id IS 'Customer subdomain code for constructing playback URLs';
