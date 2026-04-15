-- Track when a live session is paused (creator temporarily disconnected).
-- NULL = not paused. Non-null = paused at this timestamp.
ALTER TABLE public.live_sessions ADD COLUMN paused_at TIMESTAMPTZ;
