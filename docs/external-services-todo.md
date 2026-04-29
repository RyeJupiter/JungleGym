# External Services — TODO

Keys, accounts, and third-party service settings that need to be rotated, transferred, or reconfigured. Add an entry whenever something is set up under a personal account that should eventually live under a JungleGym-owned one, or when a key needs rotating.

- [ ] Switch Groq API token to a JungleGym-owned API token
  - Currently using a personal Groq key set as the `GROQ_API_KEY` Worker secret
  - Used by: ghost-tag generation (`/api/videos/create`, edit page) and audio transcription (`/api/transcribe/[videoId]`)
  - Steps: create a JungleGym-owned Groq account → generate a new API key → `wrangler secret put GROQ_API_KEY --name junglegym` to rotate → revoke the old personal key

- [ ] Add new Stripe webhook events to the prod endpoint
  - Required for the gift-payout flow (PR `davis/creator-gift-payouts`) to fully reconcile
  - Stripe Dashboard → Developers → Webhooks → edit the production endpoint at `https://junglegym.academy/api/webhooks/stripe`
  - Add events: `charge.succeeded`, `transfer.reversed`, `payout.paid`, `radar.early_fraud_warning.created`
  - Without these, payouts still work but: (a) `wallet_transactions` won't capture the Stripe-side `balance_transaction` / fee, (b) reversed transfers won't auto-unwind the `gifts.settled_at`, (c) Radar early-fraud warnings go silent
  - Davis blocked: needs Rye to share Stripe Dashboard access first

- [ ] Confirm Stripe Connect Express monthly active fee
  - Currently assumed to be **$2/mo per active connected account** (one that received a payout that month) in `docs/payment-infra.md` and the payout fee model
  - Number was pulled from older Stripe pricing pages; verify against current pricing at [stripe.com/connect/pricing](https://stripe.com/connect/pricing)
  - If the number changed, may need to revisit the auto-payout fee (currently 2.9% + $0.30, which already amortizes the inbound card fee but doesn't explicitly cover the Connect monthly)

- [ ] Set up a transactional email service
  - Required for: creator payout notifications (cron + pull), purchase receipts, password resets, dispute alerts to admins, etc.
  - Stub in place at `apps/web/src/lib/notifications/payoutEmail.ts` — currently logs `[payout-email PENDING]` and is wired into both payout routes
  - Recommended provider: **Resend** (cheapest, easiest, React Email components, generous free tier — 3k emails/mo). Postmark is the more enterprise option; SES is cheapest at scale but needs more setup.
  - Steps:
    1. Sign up under a JungleGym-owned email (not a personal account)
    2. Verify the `junglegym.academy` domain (DNS records — needs Davin's Cloudflare approval)
    3. Generate an API key → `wrangler secret put RESEND_API_KEY --name junglegym`
    4. Replace the body of `sendPayoutNotification` with the real send call
    5. Build out other transactional templates (purchase receipt, etc.) following the same module pattern
  - Until done: payout notifications log only. Creators won't know their money arrived unless they check Studio or their bank.
