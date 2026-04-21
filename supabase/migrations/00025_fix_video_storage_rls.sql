-- ============================================================
-- JungleGym – Fix video storage SELECT policy
-- ============================================================
-- PR #4 (migration 00024) tightened the "videos: creator or buyer read"
-- policy from LIKE '%' || name || '%' to LIKE '%/' || name + '%/name?%'.
-- That was wrong: videos.video_url is stored as a bare storage path
-- ("creator_id/video_id.ext"), without a leading slash or a query string,
-- so the new pattern matches nothing and every buyer got "Video coming
-- soon" on paid videos they'd purchased.
--
-- This replacement:
--   1. Preserves the original intent (buyer's purchase grants storage SELECT)
--   2. Handles the real data shape (video_url = exact object name)
--   3. Still guards against substring collisions by using EXACT match or
--      suffix-match with a slash — not a raw substring.
--
-- Substring-collision attack surface: an attacker would need to upload to
-- storage at a path that matches another video's video_url. The videos
-- bucket INSERT policy requires auth.uid()::text = (storage.foldername(name))[1],
-- i.e. you can only write under your own user_id folder — so you can't
-- plant "victim_folder/victim_file" under your own account. The tighter
-- match below is defense-in-depth on top of that.

DROP POLICY IF EXISTS "videos: creator or buyer read" ON storage.objects;

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
          AND (
            -- Typical case: video_url is stored as the bare object name
            v.video_url = name
            -- Legacy / future: video_url stored as full URL ending in /name
            OR v.video_url LIKE '%/' || name
            OR v.video_url LIKE '%/' || name || '?%'
          )
      )
    )
  );
