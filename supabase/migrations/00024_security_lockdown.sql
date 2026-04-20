-- ============================================================
-- JungleGym – Security Lockdown (2026-04-20)
-- ============================================================
-- Closes the following RLS gaps:
--   1. users.role self-escalation (learner → creator)
--   2. purchases direct INSERT (free access without Stripe)
--   3. gifts direct INSERT (forged gifts)
--   4. profiles.stripe_* self-modification (payout hijack)
--   5. videos storage SELECT LIKE '%' || name || '%' (substring collisions)
--
-- Service-role clients bypass all RLS, so legitimate server-side writes
-- (webhooks, admin actions, confirm routes) continue to work.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. users table — lock down role changes
-- ─────────────────────────────────────────────────────────────
-- The original "users: own record only" policy was FOR ALL, which let
-- authenticated users update any column including `role`. Replace with
-- explicit per-command policies. No UPDATE policy for non-service role —
-- admin approval flow already uses service role (admin/actions.ts).

DROP POLICY IF EXISTS "users: own record only" ON public.users;

CREATE POLICY "users: own record read"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users: own record insert"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users: own record delete"
  ON public.users FOR DELETE
  USING (id = auth.uid());

-- No UPDATE policy for users. Role changes go through admin actions
-- (service role). If app code ever needs to let users update their own
-- users row (e.g. email sync), add a trigger that freezes the role column.

-- Defense-in-depth: a trigger that freezes `role` against any non-service
-- caller even if a future policy accidentally allows UPDATE.
CREATE OR REPLACE FUNCTION public.freeze_user_role()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'users.role can only be changed by admins (service role)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_freeze_role ON public.users;
CREATE TRIGGER trg_users_freeze_role
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.freeze_user_role();

-- ─────────────────────────────────────────────────────────────
-- 2. purchases — remove direct INSERT by end users
-- ─────────────────────────────────────────────────────────────
-- The checkout/video/confirm route and the stripe webhook both upsert
-- purchases via the service-role client, which bypasses RLS entirely.
-- No legitimate user-initiated INSERT exists.

DROP POLICY IF EXISTS "purchases: buyer insert" ON public.purchases;

-- Keep the existing SELECT policy (viewer reads own + creator reads their
-- videos' purchases). No UPDATE/DELETE policy means service role only.

-- ─────────────────────────────────────────────────────────────
-- 3. gifts — remove direct INSERT by end users
-- ─────────────────────────────────────────────────────────────
-- /api/wallet/gift creates gifts via service role (with atomic wallet
-- debit). No client path inserts directly.

DROP POLICY IF EXISTS "gifts: giver insert" ON public.gifts;

-- ─────────────────────────────────────────────────────────────
-- 4. profiles — freeze stripe_* columns against non-service callers
-- ─────────────────────────────────────────────────────────────
-- The profiles UPDATE policy stays open for self-edits (display_name, bio,
-- rates, etc.), but payout-critical columns must be server-controlled.
-- stripe_account_id is set by /api/connect/onboard (service role).
-- stripe_onboarding_complete is set by the webhook + /api/connect/status
-- (service role).

CREATE OR REPLACE FUNCTION public.freeze_profile_stripe_fields()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id THEN
      RAISE EXCEPTION 'profiles.stripe_account_id is read-only for end users';
    END IF;
    IF NEW.stripe_onboarding_complete IS DISTINCT FROM OLD.stripe_onboarding_complete THEN
      RAISE EXCEPTION 'profiles.stripe_onboarding_complete is read-only for end users';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_freeze_stripe ON public.profiles;
CREATE TRIGGER trg_profiles_freeze_stripe
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.freeze_profile_stripe_fields();

-- ─────────────────────────────────────────────────────────────
-- 5. videos storage — tighten the signed-URL SELECT policy
-- ─────────────────────────────────────────────────────────────
-- Original policy used LIKE '%' || name || '%' which matches any
-- video_url containing the object name as a substring. Replace with a
-- suffix match so only a video_url ending in "/<name>" (or "/<name>?...")
-- grants access. UUID object names make substring collisions unlikely in
-- practice but this closes the theoretical gap.

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
            v.video_url LIKE '%/' || name
            OR v.video_url LIKE '%/' || name || '?%'
          )
      )
    )
  );
