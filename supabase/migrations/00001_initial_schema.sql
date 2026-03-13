-- ============================================================
-- JungleGym – Initial Schema
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- Enums
-- ──────────────────────────────────────────────────────────────
CREATE TYPE public.user_role AS ENUM ('creator', 'learner');
CREATE TYPE public.session_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE public.price_tier AS ENUM ('supported', 'community', 'abundance');

-- ──────────────────────────────────────────────────────────────
-- Users (mirrors auth.users with role)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE,
  role       public.user_role NOT NULL DEFAULT 'learner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'App-level user records — creator or learner.';

-- ──────────────────────────────────────────────────────────────
-- Profiles
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  username     TEXT NOT NULL UNIQUE,
  photo_url    TEXT,
  bio          TEXT,
  tagline      TEXT,
  location     TEXT,
  tags         TEXT[] NOT NULL DEFAULT '{}',

  -- Creator pricing defaults ($ per minute of video content)
  supported_rate NUMERIC(6, 2) NOT NULL DEFAULT 1.00,
  community_rate NUMERIC(6, 2) NOT NULL DEFAULT 2.00,
  abundance_rate NUMERIC(6, 2) NOT NULL DEFAULT 3.00,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_\-]{3,32}$'),
  CONSTRAINT valid_rates CHECK (
    supported_rate > 0 AND community_rate >= supported_rate AND abundance_rate >= community_rate
  )
);

COMMENT ON TABLE public.profiles IS 'Unified profile for creators and learners.';
COMMENT ON COLUMN public.profiles.tags IS 'Disciplines / interests e.g. ["yoga","strength","mobility"]';

-- ──────────────────────────────────────────────────────────────
-- Videos
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.videos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  thumbnail_url    TEXT,
  video_url        TEXT,
  duration_seconds INT CHECK (duration_seconds > 0),
  is_free          BOOLEAN NOT NULL DEFAULT false,

  -- Pre-calculated fun prices (NULL for free videos)
  price_supported NUMERIC(8, 2),
  price_community NUMERIC(8, 2),
  price_abundance NUMERIC(8, 2),

  tags       TEXT[] NOT NULL DEFAULT '{}',
  published  BOOLEAN NOT NULL DEFAULT false,
  view_count INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT paid_prices_required CHECK (
    is_free OR (price_supported IS NOT NULL AND price_community IS NOT NULL AND price_abundance IS NOT NULL)
  )
);

COMMENT ON TABLE public.videos IS 'Video content — free or three-tier paid.';

-- ──────────────────────────────────────────────────────────────
-- Purchases
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.purchases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id    UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  tier        public.price_tier NOT NULL,
  amount_paid NUMERIC(8, 2) NOT NULL CHECK (amount_paid > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, video_id)
);

COMMENT ON TABLE public.purchases IS 'Learner purchases of paid videos.';

-- ──────────────────────────────────────────────────────────────
-- Live Sessions
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.live_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes SMALLINT NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  status           public.session_status NOT NULL DEFAULT 'scheduled',
  max_participants INT CHECK (max_participants > 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.live_sessions IS 'Live sessions — gift-based, no minimum.';

-- ──────────────────────────────────────────────────────────────
-- Gifts
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.gifts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  giver_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  creator_amount   NUMERIC(10, 2) NOT NULL CHECK (creator_amount > 0),
  platform_tip_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.00,  -- adjustable, can be 0
  platform_amount  NUMERIC(10, 2) NOT NULL,
  total_amount     NUMERIC(10, 2) NOT NULL,
  message          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tip_pct_range CHECK (platform_tip_pct >= 0 AND platform_tip_pct <= 100)
);

COMMENT ON TABLE public.gifts IS
  'Gifts sent to creators during live sessions. 100% of creator_amount goes to creator. Platform tip is added on top by the giver and is fully adjustable (default 10%, can be 0).';

-- ──────────────────────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────────────────────
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_tags ON public.profiles USING gin(tags);

CREATE INDEX idx_videos_creator ON public.videos(creator_id);
CREATE INDEX idx_videos_published ON public.videos(published) WHERE published = true;
CREATE INDEX idx_videos_tags ON public.videos USING gin(tags);
CREATE INDEX idx_videos_free ON public.videos(is_free);

CREATE INDEX idx_purchases_user ON public.purchases(user_id);
CREATE INDEX idx_purchases_video ON public.purchases(video_id);

CREATE INDEX idx_sessions_creator ON public.live_sessions(creator_id);
CREATE INDEX idx_sessions_status ON public.live_sessions(status);
CREATE INDEX idx_sessions_scheduled ON public.live_sessions(scheduled_at);

CREATE INDEX idx_gifts_session ON public.gifts(session_id);
CREATE INDEX idx_gifts_giver ON public.gifts(giver_id);

-- ──────────────────────────────────────────────────────────────
-- updated_at trigger
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON public.live_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
