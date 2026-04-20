-- NUCLEAR: reset all payment state
--
-- Wipes every row in purchases, gifts, wallets, and wallet_transactions.
-- Everything else (users, profiles, videos, sessions, memberships,
-- email_captures, video_shares, teacher_applications) is left alone.
--
-- Stripe side is NOT touched — PaymentIntents/Charges stay on Rye's account.
-- Refund test charges manually in the Stripe dashboard if you want them cleared
-- from the Stripe books too.
--
-- Run this in the Supabase SQL editor. Wrapped in a transaction so nothing
-- deletes if any statement fails. Swap COMMIT for ROLLBACK to dry-run.

BEGIN;

DELETE FROM public.wallet_transactions;
DELETE FROM public.wallets;
DELETE FROM public.gifts;
DELETE FROM public.purchases;

-- Sanity check — all should be 0
SELECT
  (SELECT COUNT(*) FROM public.purchases)           AS purchases,
  (SELECT COUNT(*) FROM public.gifts)               AS gifts,
  (SELECT COUNT(*) FROM public.wallets)             AS wallets,
  (SELECT COUNT(*) FROM public.wallet_transactions) AS wallet_tx;

COMMIT;
