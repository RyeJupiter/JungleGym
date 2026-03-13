-- ============================================================
-- JungleGym – Row Level Security Policies
-- ============================================================

ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts         ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────
-- users
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "users: own record only"
  ON public.users FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- profiles — all public for discovery
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "profiles: public read"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles: own write"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "profiles: own delete"
  ON public.profiles FOR DELETE
  USING (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- videos — published videos are public; drafts only to creator
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "videos: public can see published"
  ON public.videos FOR SELECT
  USING (published = true OR creator_id = auth.uid());

CREATE POLICY "videos: creator insert"
  ON public.videos FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "videos: creator update"
  ON public.videos FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "videos: creator delete"
  ON public.videos FOR DELETE
  USING (creator_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- purchases — user sees their own; creator sees purchases of their videos
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "purchases: viewer"
  ON public.purchases FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = video_id AND v.creator_id = auth.uid()
    )
  );

CREATE POLICY "purchases: buyer insert"
  ON public.purchases FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- live_sessions — public read; creator manages
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "live_sessions: public read"
  ON public.live_sessions FOR SELECT
  USING (true);

CREATE POLICY "live_sessions: creator insert"
  ON public.live_sessions FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "live_sessions: creator update"
  ON public.live_sessions FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "live_sessions: creator delete"
  ON public.live_sessions FOR DELETE
  USING (creator_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- gifts — giver and creator of the session can read
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "gifts: viewer"
  ON public.gifts FOR SELECT
  USING (
    giver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.live_sessions ls
      WHERE ls.id = session_id AND ls.creator_id = auth.uid()
    )
  );

CREATE POLICY "gifts: giver insert"
  ON public.gifts FOR INSERT
  WITH CHECK (giver_id = auth.uid());
