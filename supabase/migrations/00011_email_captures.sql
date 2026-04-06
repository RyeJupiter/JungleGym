-- ============================================================
-- JungleGym – Email captures (newsletter / waitlist)
-- ============================================================

CREATE TABLE public.email_captures (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT 'homepage',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT email_captures_email_unique UNIQUE (email)
);

ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;

-- Only service role can read; anyone can insert (anon or auth)
CREATE POLICY "email_captures: insert"
  ON public.email_captures FOR INSERT
  WITH CHECK (true);
