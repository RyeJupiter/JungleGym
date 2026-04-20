-- NUCLEAR: reset teacher applications + their demo videos
--
-- Wipes every row in public.teacher_applications and every file in the
-- teacher-applications storage bucket. Leaves users.role alone — anyone
-- you previously approved as a creator stays a creator.
--
-- Run this in the Supabase SQL editor. Wrapped in a transaction so
-- nothing deletes if any statement fails. Swap COMMIT for ROLLBACK to
-- dry-run.

BEGIN;

-- 1. Delete demo video files from the teacher-applications bucket
DELETE FROM storage.objects
WHERE bucket_id = 'teacher-applications';

-- 2. Delete the application rows
DELETE FROM public.teacher_applications;

-- Sanity check — both should be 0
SELECT
  (SELECT COUNT(*) FROM public.teacher_applications)                              AS applications,
  (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'teacher-applications') AS demo_files;

COMMIT;

-- ── Optional follow-ups ─────────────────────────────────────────────────
-- Reset a specific user back to learner (run separately, replace UUID):
--   UPDATE public.users SET role = 'learner' WHERE id = '<user-uuid>';
--
-- Reset a single applicant only (replace UUID, run instead of step 2):
--   DELETE FROM public.teacher_applications WHERE user_id = '<user-uuid>';
