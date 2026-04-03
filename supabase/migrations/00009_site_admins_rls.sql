-- ============================================================
-- site_admins table + RLS
-- Allows the two hardcoded admins and any dynamic admins to
-- manage the table via the regular anon/auth client — no
-- service role key required for admin management.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.site_admins (
  email     text PRIMARY KEY,
  added_by  text,
  added_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_admins ENABLE ROW LEVEL SECURITY;

-- Hardcoded admins OR existing dynamic admins can do anything
CREATE POLICY "site_admins: admins only"
  ON public.site_admins
  FOR ALL
  TO authenticated
  USING (
    auth.email() IN ('rye.seekkins@gmail.com', 'davis@earthpulse.dev')
    OR EXISTS (
      SELECT 1 FROM public.site_admins sa WHERE sa.email = auth.email()
    )
  )
  WITH CHECK (
    auth.email() IN ('rye.seekkins@gmail.com', 'davis@earthpulse.dev')
    OR EXISTS (
      SELECT 1 FROM public.site_admins sa WHERE sa.email = auth.email()
    )
  );
