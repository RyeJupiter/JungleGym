-- ============================================================
-- JungleGym – Soft delete for videos
-- ============================================================
-- Creators can delete a video from the studio, which sets
-- deleted_at = now() and published = false. Public queries must
-- treat deleted_at IS NOT NULL as gone. Admins can restore (clear
-- deleted_at) from the admin panel within the 30-day window. A
-- separate purge job (TODO) hard-deletes the row + storage objects
-- after deleted_at < now() - 30 days.

ALTER TABLE public.videos
  ADD COLUMN deleted_at timestamptz;

-- Partial index for the admin "recently deleted" query — cheap
-- because the vast majority of rows stay NULL.
CREATE INDEX IF NOT EXISTS videos_deleted_at_idx
  ON public.videos (deleted_at)
  WHERE deleted_at IS NOT NULL;
