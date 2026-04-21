-- ============================================================
-- JungleGym – Auto-transcription for videos
-- ============================================================
-- Adds transcript columns to videos and a public-read transcripts
-- storage bucket for WebVTT caption files.
--
-- Flow:
--   1. Creator uploads a video; browser extracts audio + uploads chunk(s)
--      to the transcripts bucket at audio/{videoId}/{chunkIndex}.webm
--   2. /api/transcribe/[videoId] downloads audio via service role,
--      calls Groq Whisper, writes vtt/{videoId}.vtt into same bucket,
--      and updates the row below.
--   3. Ghost tags are regenerated from title + transcript_text.
--
-- Captions are always visible (no creator toggle) and failures surface
-- on the admin page's Issues panel, not to the creator.

ALTER TABLE public.videos
  ADD COLUMN transcript_text text,
  ADD COLUMN transcript_vtt_path text,
  ADD COLUMN transcript_status text NOT NULL DEFAULT 'pending'
    CHECK (transcript_status IN ('pending','processing','completed','failed')),
  ADD COLUMN transcript_error text,
  ADD COLUMN transcript_attempts integer NOT NULL DEFAULT 0;

-- Index for the admin Issues panel query (failed transcriptions).
CREATE INDEX IF NOT EXISTS videos_transcript_status_idx
  ON public.videos (transcript_status)
  WHERE transcript_status IN ('failed','processing');

-- Transcripts bucket: public read so the <track> element can fetch
-- VTTs without a signed URL, service-role only writes.
INSERT INTO storage.buckets (id, name, public)
VALUES ('transcripts', 'transcripts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Creators can read their own audio chunks (used by the /api/transcribe
-- route when called from the client with the creator's session — not
-- strictly needed because the route uses service role, but harmless
-- and allows future client-side debugging).
DROP POLICY IF EXISTS "transcripts: public read" ON storage.objects;
CREATE POLICY "transcripts: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'transcripts');

-- Authenticated creators can upload audio chunks under their own
-- user_id folder: audio/{userId}/{videoId}/{chunkIndex}.webm
DROP POLICY IF EXISTS "transcripts: creator audio insert" ON storage.objects;
CREATE POLICY "transcripts: creator audio insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'transcripts'
    AND (storage.foldername(name))[1] = 'audio'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Creators can overwrite/delete their own audio chunks (retry path).
DROP POLICY IF EXISTS "transcripts: creator audio update" ON storage.objects;
CREATE POLICY "transcripts: creator audio update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'transcripts'
    AND (storage.foldername(name))[1] = 'audio'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "transcripts: creator audio delete" ON storage.objects;
CREATE POLICY "transcripts: creator audio delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'transcripts'
    AND (storage.foldername(name))[1] = 'audio'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
