-- Fix double-credit race condition on wallet top-ups.
-- The confirm route and webhook can both pass the SELECT check simultaneously,
-- causing duplicate credits. A unique partial index prevents the second INSERT.

CREATE UNIQUE INDEX idx_wallet_tx_topup_unique
  ON public.wallet_transactions(description)
  WHERE type = 'topup' AND description IS NOT NULL;
