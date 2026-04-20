-- ============================================================
-- JungleGym — Enable RLS on teacher_applications
-- ============================================================
-- Table was created in 00005 without RLS, so anyone with the anon key
-- could read/write every row. Admin mutations already go through the
-- service role via admin/actions.ts, so we lock it down to:
--
--   SELECT  → user_id = auth.uid()   (applicants see their own)
--   INSERT  → user_id = auth.uid()   (applicants submit their own)
--   UPDATE / DELETE → no policy      (admins bypass via service role)

ALTER TABLE public.teacher_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_applications: applicant read own"
  ON public.teacher_applications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "teacher_applications: applicant insert own"
  ON public.teacher_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());
