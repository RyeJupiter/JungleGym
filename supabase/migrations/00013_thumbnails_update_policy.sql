-- Allow creators to overwrite their own thumbnails.
-- The INSERT policy already exists; upsert also needs UPDATE.
CREATE POLICY "thumbnails: creator update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
