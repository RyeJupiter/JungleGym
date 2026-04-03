-- ============================================================
-- site_admins table + RLS
--
-- Two tiers of admin:
--   superadmin — hardcoded in ADMIN_EMAILS (lib/admin.ts)
--                can manage site_admins + creators
--   admin      — rows in this table
--                can manage creators only
--
-- RLS enforces the write restriction at the DB level so no
-- server-side code path can accidentally bypass it.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.site_admins (
  email     text PRIMARY KEY,
  added_by  text,
  added_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_admins ENABLE ROW LEVEL SECURITY;

-- SELECT:
--   superadmins can see all rows (needed to list admins in the UI)
--   any authenticated user can see their own row (needed for auth check)
CREATE POLICY "site_admins: select"
  ON public.site_admins FOR SELECT
  TO authenticated
  USING (
    auth.email() IN ('rye.seekkins@gmail.com', 'davis@earthpulse.dev')
    OR auth.email() = email
  );

-- INSERT: superadmins only
CREATE POLICY "site_admins: insert"
  ON public.site_admins FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.email() IN ('rye.seekkins@gmail.com', 'davis@earthpulse.dev')
  );

-- DELETE: superadmins only
CREATE POLICY "site_admins: delete"
  ON public.site_admins FOR DELETE
  TO authenticated
  USING (
    auth.email() IN ('rye.seekkins@gmail.com', 'davis@earthpulse.dev')
  );
