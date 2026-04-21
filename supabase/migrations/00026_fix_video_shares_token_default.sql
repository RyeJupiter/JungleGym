-- ============================================================
-- JungleGym – Fix video_shares.token default encoding
-- ============================================================
-- 00006 set the token DEFAULT to:
--   encode(gen_random_bytes(24), 'base64url')
-- base64url as an encode() format was added in PostgreSQL 17. This
-- Supabase project runs an older version, so every INSERT against
-- video_shares has been failing at the DEFAULT evaluation step with:
--   code 22023 "unrecognized encoding: base64url"
-- which surfaces as a 400 from PostgREST. The result: no share row has
-- ever been created in prod, and "Share with a friend" has been broken
-- since day one.
--
-- Swap to hex, which is universally supported and produces a URL-safe
-- 48-char token. Longer than base64url's 32-char output but still
-- opaque and still easy to generate.

ALTER TABLE public.video_shares
  ALTER COLUMN token SET DEFAULT encode(gen_random_bytes(24), 'hex');
