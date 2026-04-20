-- ============================================================
-- JungleGym — Video share expiry (30-day friend access)
-- ============================================================
-- Adds expires_at to purchases so share redemptions grant temporary
-- access. NULL = permanent (normal paid purchase). Non-NULL = expires.

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- No additional index needed: the existing UNIQUE(user_id, video_id) index
-- on purchases handles every ownership lookup. A partial index on
-- `expires_at IS NULL OR expires_at > NOW()` wouldn't work anyway —
-- Postgres requires index predicates to be IMMUTABLE, and NOW() is STABLE.

-- Replace RPC to stamp expires_at on share-redemption purchases.
-- If the recipient already has a temp (share) purchase for this video,
-- extend its expiry to the fresh 30 days. If they already have a paid
-- (permanent) purchase, leave it alone — they already own the video.
CREATE OR REPLACE FUNCTION public.redeem_video_share(
  p_token    TEXT,
  p_user_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share      video_shares%ROWTYPE;
  v_expires_at TIMESTAMPTZ := NOW() + INTERVAL '30 days';
BEGIN
  SELECT * INTO v_share
  FROM video_shares
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid_token');
  END IF;

  -- Same user re-clicking their own redemption is fine (idempotent).
  -- A different user hitting an already-redeemed share is blocked.
  IF v_share.redeemed_by IS NOT NULL AND v_share.redeemed_by != p_user_id THEN
    RETURN jsonb_build_object('error', 'already_redeemed');
  END IF;

  -- Self-redemption of own share is nonsense and would burn the share.
  IF v_share.owner_user_id = p_user_id THEN
    RETURN jsonb_build_object('error', 'cannot_redeem_own');
  END IF;

  -- Insert temp purchase; if a temp row already exists, extend its expiry;
  -- if a permanent (paid) row exists, leave it completely alone.
  INSERT INTO purchases
    (user_id, video_id, tier, amount_paid, platform_tip_pct, platform_amount, total_amount, expires_at)
  VALUES
    (p_user_id, v_share.video_id, 'supported', 0, 0, 0, 0, v_expires_at)
  ON CONFLICT (user_id, video_id) DO UPDATE
    SET expires_at = EXCLUDED.expires_at
    WHERE purchases.expires_at IS NOT NULL;

  UPDATE video_shares
  SET redeemed_by = p_user_id, redeemed_at = NOW()
  WHERE id = v_share.id AND redeemed_by IS NULL;

  RETURN jsonb_build_object(
    'video_id', v_share.video_id,
    'owner_user_id', v_share.owner_user_id,
    'expires_at', v_expires_at
  );
END;
$$;
