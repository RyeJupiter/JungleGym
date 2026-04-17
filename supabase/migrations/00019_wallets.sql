-- ============================================================
-- Wallets — prepaid balance for instant gifts
-- ============================================================

CREATE TYPE public.wallet_tx_type AS ENUM ('topup', 'gift_sent', 'gift_received', 'refund');

-- ── Wallet balance (one per user) ────────────────────────────
CREATE TABLE public.wallets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  balance    NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.wallets IS 'Prepaid wallet balance for instant gifts. One per user.';

CREATE TRIGGER trg_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Transaction ledger ───────────────────────────────────────
CREATE TABLE public.wallet_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type         public.wallet_tx_type NOT NULL,
  amount       NUMERIC(10, 2) NOT NULL,
  balance_after NUMERIC(10, 2) NOT NULL,
  related_id   UUID,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.wallet_transactions IS 'Immutable ledger of all wallet balance changes.';
COMMENT ON COLUMN public.wallet_transactions.amount IS 'Positive for credits (topup, gift_received), negative for debits (gift_sent).';
COMMENT ON COLUMN public.wallet_transactions.related_id IS 'FK to gifts.id, stripe payment intent, etc.';

CREATE INDEX idx_wallet_tx_user ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_tx_created ON public.wallet_transactions(created_at);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own wallet
CREATE POLICY wallets_select ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own transactions
CREATE POLICY wallet_tx_select ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (server-side API routes)
-- No insert/update policies for anon/authenticated — all mutations go through API routes
