-- ──────────────────────────────────────────────────────────────
-- Add platform tip fields to purchases (mirrors gift model)
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.purchases
  ADD COLUMN platform_tip_pct  NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  ADD COLUMN platform_amount   NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN total_amount      NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  ADD CONSTRAINT purchase_tip_pct_range CHECK (platform_tip_pct >= 0 AND platform_tip_pct <= 100);

COMMENT ON COLUMN public.purchases.amount_paid      IS 'Video price for the selected tier — 100% goes to creator.';
COMMENT ON COLUMN public.purchases.platform_tip_pct IS 'Buyer-adjustable platform tip percentage (default 10%). Can be 0.';
COMMENT ON COLUMN public.purchases.platform_amount  IS 'Tip amount added on top: amount_paid * (platform_tip_pct / 100).';
COMMENT ON COLUMN public.purchases.total_amount     IS 'Total charged to buyer: amount_paid + platform_amount.';
