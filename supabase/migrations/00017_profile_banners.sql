-- ============================================================
-- JungleGym – Profile Banner Storage Bucket
-- ============================================================

-- Banner images for treehouse header bars (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-banners', 'profile-banners', true,
  10485760, -- 10 MB (landscape photos can be larger)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- ──────────────────────────────────────────────────────────────
-- profile-banners policies
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "profile-banners: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-banners');

CREATE POLICY "profile-banners: owner write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "profile-banners: owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "profile-banners: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-banners' AND auth.uid()::text = (storage.foldername(name))[1]);
