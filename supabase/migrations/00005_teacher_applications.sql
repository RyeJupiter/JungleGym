-- ============================================================
-- JungleGym – Teacher Applications
-- ============================================================
-- Everyone joins as a learner. This table tracks applications
-- to become a teacher/creator on the network.
-- Approval is manual — an admin updates status and flips the user's role.
-- ============================================================

CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.teacher_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  motivation  TEXT,
  status      public.application_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.teacher_applications IS
  'Applications from learners to become teachers/creators. Approved manually by admins.';

CREATE INDEX idx_teacher_applications_user    ON public.teacher_applications(user_id);
CREATE INDEX idx_teacher_applications_status  ON public.teacher_applications(status);

CREATE TRIGGER trg_teacher_applications_updated_at
  BEFORE UPDATE ON public.teacher_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
