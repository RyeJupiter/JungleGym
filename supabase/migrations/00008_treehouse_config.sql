-- ============================================================
-- JungleGym – Treehouse Config + Gallery/Intro Storage
-- ============================================================

-- Add treehouse layout config to profiles (NULL = default layout)
ALTER TABLE public.profiles
  ADD COLUMN treehouse_config JSONB DEFAULT NULL;

COMMENT ON COLUMN public.profiles.treehouse_config IS
  'JSONB treehouse layout config. NULL = default layout.';

-- ──────────────────────────────────────────────────────────────
-- Gallery images bucket (public read, 10 MB, images only)
-- ──────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery-images', 'gallery-images', true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

CREATE POLICY "gallery-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery-images');

CREATE POLICY "gallery-images: owner write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "gallery-images: owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'gallery-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "gallery-images: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ──────────────────────────────────────────────────────────────
-- Intro videos bucket (public read, 100 MB, video only)
-- ──────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intro-videos', 'intro-videos', true,
  104857600,  -- 100 MB
  ARRAY['video/mp4', 'video/webm']
);

CREATE POLICY "intro-videos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'intro-videos');

CREATE POLICY "intro-videos: owner write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'intro-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "intro-videos: owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'intro-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "intro-videos: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'intro-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
