-- ============================================================
-- JungleGym – Memberships ($100/month, 6 video picks)
-- ============================================================

-- Add stripe_payment_intent_id to purchases for idempotency
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Memberships table
CREATE TABLE public.memberships (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT UNIQUE,
  status                  TEXT NOT NULL DEFAULT 'active',
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships: owner read"
  ON public.memberships FOR SELECT
  USING (user_id = auth.uid());

-- Index for fast lookup
CREATE INDEX memberships_user_id_idx ON public.memberships (user_id);

-- Video picks for members (max 6 active picks per member)
CREATE TABLE public.membership_video_picks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id      UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  picked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_pick_per_member_video UNIQUE (membership_id, video_id)
);

ALTER TABLE public.membership_video_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membership_picks: owner read"
  ON public.membership_video_picks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "membership_picks: owner insert"
  ON public.membership_video_picks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "membership_picks: owner delete"
  ON public.membership_video_picks FOR DELETE
  USING (user_id = auth.uid());
