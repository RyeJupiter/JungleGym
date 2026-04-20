-- ============================================================
-- JungleGym — Storage bucket for teacher application demo videos
-- ============================================================
-- Private bucket. Files stored under {user_id}/{filename}.
-- Admins read via server-generated signed URLs (service role).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'teacher-applications',
  'teacher-applications',
  false,
  524288000,  -- 500 MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Applicant can upload their own demo
CREATE POLICY "teacher-applications: applicant upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'teacher-applications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Applicant can read their own demo (so they can preview before submit)
CREATE POLICY "teacher-applications: applicant read own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'teacher-applications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Applicant can replace / delete their own demo until the app is reviewed
CREATE POLICY "teacher-applications: applicant delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'teacher-applications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
