-- ============================================================
-- Payment audit + gift settlement infrastructure
--
-- 1. stripe_events       — append-only audit log of every webhook
-- 2. wallet_transactions — Stripe provenance columns + backfill
-- 3. gifts               — settlement columns
-- 4. creator_payouts     — one row per Stripe Transfer
-- ============================================================

-- ── 1. stripe_events ─────────────────────────────────────────
CREATE TABLE public.stripe_events (
  id               TEXT PRIMARY KEY,                -- Stripe event id (evt_…). PK = built-in idempotency.
  type             TEXT NOT NULL,
  payload          JSONB NOT NULL,
  received_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at     TIMESTAMPTZ,
  processing_error TEXT
);

CREATE INDEX idx_stripe_events_type     ON public.stripe_events(type);
CREATE INDEX idx_stripe_events_received ON public.stripe_events(received_at DESC);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- Service role only. No user policies — admin reads happen via service client.

COMMENT ON TABLE public.stripe_events IS
  'Append-only audit log of every Stripe webhook. id is the Stripe event id, so duplicate deliveries hit the PK and short-circuit.';

-- ── 2. wallet_transactions provenance ────────────────────────
ALTER TABLE public.wallet_transactions
  ADD COLUMN stripe_payment_intent_id TEXT,
  ADD COLUMN stripe_charge_id         TEXT,
  ADD COLUMN stripe_balance_tx_id     TEXT;

-- Backfill from existing 'topup:pi_…' descriptions BEFORE enforcing the unique index.
UPDATE public.wallet_transactions
SET stripe_payment_intent_id = SUBSTRING(description FROM '^topup:(pi_[A-Za-z0-9_]+)$')
WHERE type = 'topup'
  AND description LIKE 'topup:pi_%'
  AND stripe_payment_intent_id IS NULL;

-- One credit per PaymentIntent. Replaces the legacy idx_wallet_tx_topup_unique
-- (which keyed on `description`) with a real column-backed constraint.
CREATE UNIQUE INDEX uq_wallet_tx_pi
  ON public.wallet_transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- The legacy description-based unique index is now redundant. Drop it so
-- future descriptions (gift refunds, etc.) aren't inadvertently constrained.
DROP INDEX IF EXISTS idx_wallet_tx_topup_unique;

COMMENT ON COLUMN public.wallet_transactions.stripe_payment_intent_id IS
  'PaymentIntent id (pi_…) that funded this credit. UNIQUE across topup rows — guarantees one wallet credit per Stripe charge.';
COMMENT ON COLUMN public.wallet_transactions.stripe_charge_id IS
  'Charge id (ch_…) populated from charge.succeeded webhook. Useful for refund reconciliation.';
COMMENT ON COLUMN public.wallet_transactions.stripe_balance_tx_id IS
  'BalanceTransaction id (txn_…) populated from charge.succeeded. Authoritative source for settled funds + Stripe-side fee.';

-- ── 3. gifts settlement columns ──────────────────────────────
ALTER TABLE public.gifts
  ADD COLUMN settled_at      TIMESTAMPTZ,
  ADD COLUMN transfer_id     TEXT,
  ADD COLUMN settlement_fee  NUMERIC(10, 2),
  ADD COLUMN settlement_mode TEXT
    CHECK (settlement_mode IN ('scheduled', 'pull'));

-- Drives the "what does this creator have unsettled?" query in the cron + studio UI.
CREATE INDEX idx_gifts_unsettled
  ON public.gifts(creator_amount)
  WHERE settled_at IS NULL;

COMMENT ON COLUMN public.gifts.settled_at IS
  'When this gift was bundled into a Stripe Transfer to the creator. NULL = unsettled, owed by JungleGym.';
COMMENT ON COLUMN public.gifts.transfer_id IS
  'Stripe Transfer id (tr_…) that settled this gift. Multiple gifts share a transfer_id when bundled.';
COMMENT ON COLUMN public.gifts.settlement_fee IS
  'Per-gift slice of the payout fee carved out at settlement time. Sum across a transfer batch = total fee on creator_payouts.fee.';

-- ── 4. creator_payouts ───────────────────────────────────────
CREATE TABLE public.creator_payouts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  transfer_id    TEXT NOT NULL UNIQUE,                       -- Stripe Transfer id (tr_…)
  amount_paid    NUMERIC(10, 2) NOT NULL CHECK (amount_paid > 0),
  fee            NUMERIC(10, 2) NOT NULL CHECK (fee >= 0),
  gross_amount   NUMERIC(10, 2) NOT NULL,                    -- amount_paid + fee
  gift_count     INT NOT NULL CHECK (gift_count > 0),
  mode           TEXT NOT NULL CHECK (mode IN ('scheduled', 'pull')),
  status         TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'reversed')),
  failure_reason TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at        TIMESTAMPTZ,
  CONSTRAINT gross_eq_paid_plus_fee CHECK (gross_amount = amount_paid + fee)
);

CREATE INDEX idx_creator_payouts_creator ON public.creator_payouts(creator_id, created_at DESC);
CREATE INDEX idx_creator_payouts_status  ON public.creator_payouts(status) WHERE status IN ('pending', 'failed');

ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;

-- Creators can read their own payout history (drives studio UI).
CREATE POLICY creator_payouts_select_own ON public.creator_payouts
  FOR SELECT USING (auth.uid() = creator_id);

-- Inserts/updates only via service client — no policies for anon/authenticated.

COMMENT ON TABLE public.creator_payouts IS
  'One row per Stripe Transfer to a creator. Bundles multiple gifts (gift_count) into a single payout. status driven by transfer.* webhooks.';
