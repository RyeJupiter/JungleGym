-- NUCLEAR: reset teacher applications
--
-- Wipes every row in public.teacher_applications. Leaves users.role
-- alone — anyone you previously approved as a creator stays a creator.
--
-- ⚠️ Storage cleanup is a separate step. Supabase blocks direct DELETE
-- from storage.objects via a protect_delete trigger, so the demo videos
-- in the teacher-applications bucket need to be cleared from the
-- dashboard:
--   Supabase → Storage → teacher-applications → select all → Delete
-- (Old demos won't break anything if left — they're orphaned but
-- harmless. Worth tidying up periodically.)
--
-- Wrapped in a transaction so nothing deletes if any statement fails.
-- Swap COMMIT for ROLLBACK to dry-run.

BEGIN;

DELETE FROM public.teacher_applications;

-- Sanity check — should be 0
SELECT COUNT(*) AS applications FROM public.teacher_applications;

COMMIT;

-- ── Optional follow-ups ─────────────────────────────────────────────────
-- Reset a specific user back to learner (run separately, replace UUID):
--   UPDATE public.users SET role = 'learner' WHERE id = '<user-uuid>';
--
-- Reset a single applicant only (replace UUID, run instead of the
-- bare DELETE above):
--   DELETE FROM public.teacher_applications WHERE user_id = '<user-uuid>';
