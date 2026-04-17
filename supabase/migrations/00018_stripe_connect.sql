-- ============================================================
-- Stripe Connect — add connected account fields to profiles
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN stripe_account_id          TEXT,
  ADD COLUMN stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.stripe_account_id IS 'Stripe Connect Express account ID (acct_xxx). NULL = not connected.';
COMMENT ON COLUMN public.profiles.stripe_onboarding_complete IS 'True once Stripe confirms charges_enabled on the connected account.';

CREATE INDEX idx_profiles_stripe_account ON public.profiles(stripe_account_id) WHERE stripe_account_id IS NOT NULL;
