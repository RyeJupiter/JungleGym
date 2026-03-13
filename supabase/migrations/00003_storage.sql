-- ============================================================
-- JungleGym – Supabase Storage Buckets
-- ============================================================

-- Profile photos (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos', 'profile-photos', true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Video thumbnails (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails', 'thumbnails', true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Video files (private; access controlled via signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos', 'videos', false,
  5368709120,  -- 5 GB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
);

-- ──────────────────────────────────────────────────────────────
-- profile-photos policies
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "profile-photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "profile-photos: owner write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "profile-photos: owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "profile-photos: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ──────────────────────────────────────────────────────────────
-- thumbnails policies
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "thumbnails: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

CREATE POLICY "thumbnails: creator write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "thumbnails: creator delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ──────────────────────────────────────────────────────────────
-- videos policies (private bucket; creator uploads, purchasers read via signed URL)
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "videos: creator upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "videos: creator or buyer read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'videos'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.purchases p
        JOIN public.videos v ON v.id = p.video_id
        WHERE p.user_id = auth.uid()
          AND v.video_url LIKE '%' || name || '%'
      )
    )
  );

CREATE POLICY "videos: creator delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
