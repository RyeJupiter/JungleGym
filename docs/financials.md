# JungleGym Financials

Plain-numbers view of where money comes in, where it goes out, and how much volume we need to break even. Living document — update when fees change or when actual usage data comes in.

> **Source-of-truth pointers:**
> - Wallet/gift fees: `packages/shared/src/utils/pricing.ts`
> - Video purchase fee: `PLATFORM_FEE_PCT` in same file (currently 20)
> - Live Stripe pricing: [stripe.com/connect/pricing](https://stripe.com/connect/pricing) — re-verify yearly
> - Cloudflare/Supabase tier pricing: same — links throughout

---

## 1. Revenue — what JungleGym takes

| Source | Rate | Triggered by | Code path |
|---|---|---|---|
| **Wallet top-up fee** | 7% of wallet amount | Buyer adds funds | `WALLET_TOPUP_FEE_PCT`, `/api/wallet/topup` |
| **Video purchase platform fee** | 20% of total | Each paid video sale | `PLATFORM_FEE_PCT`, `/api/checkout/video` |
| **Pull-payout fee** | 2.5% of gross | Creator off-cycle withdraws gift balance | `PAYOUT_PULL_FEE_PCT`, `/api/payouts/withdraw` |
| Session-gift platform fee | 0% | Currently zero by design | `/api/wallet/gift` sets `platform_amount: 0` |
| Monthly auto-payout fee | 0% | Free at JungleGym layer | `/api/cron/payout-creator-gifts` |

These three are the only revenue streams. Everything else is pass-through.

---

## 2. Cost structure — what JungleGym pays

### Variable costs (scale with volume)

| Cost | Rate | Notes |
|---|---|---|
| Stripe inbound (card charge) | 2.9% + $0.30 | Per top-up + per video purchase. Deducted from gross before settlement (or from `application_fee_amount` for destination charges). |
| Cloudflare Stream — delivery | $1 per 1,000 minutes delivered | Live sessions + intro videos hosted on CF Stream |
| Cloudflare Stream — storage | $5 per 1,000 minutes stored / month | Treehouse intro videos + recorded streams |
| Cloudflare R2 — storage | $0.015 / GB-month | Video files, thumbnails, audio chunks, VTT |
| Cloudflare R2 — egress | $0 | Free egress is the whole reason we're on R2 |
| Supabase — database/storage above tier | varies | Pro tier $25/mo includes generous limits |
| Groq API | ~$0 at our scale | Free tier covers transcription + ghost tags well past current volume |

### Fixed costs (per month, regardless of volume)

| Cost | Amount | Notes |
|---|---|---|
| Cloudflare Workers Paid plan | **$5/mo** | Required once we exceed free-tier 100k req/day; minimal CPU cost on top |
| Supabase Pro | **$25/mo** | Required for prod app (better DB limits, daily backups, point-in-time recovery) |
| Stripe Connect Express monthly active | **$2/mo × N creators** | N = number of creators who received any payout that month |
| Domain registration | ~**$1/mo** | $12/yr for `junglegym.academy` |
| **Total fixed (excluding Connect)** | **~$31/mo** | |

### Costs explicitly out of scope (per Davis's guidance)
- **Claude API / Claude Code dev assistance** — engineering tooling, not a runtime cost. Will be self-funded out of revenue once the platform has volume; not factored into break-even.

### Costs that AREN'T JungleGym's
- Stripe `0.25% + $0.25` per connected→bank payout — paid by the creator, deducted from their balance by Stripe. We disclose in studio UI.
- Connected-account dispute fees — paid by the creator's account.

---

## 3. Per-transaction unit economics

Walked through with real numbers, end-to-end.

### Wallet top-up (buyer-side)

JungleGym net = (top-up fee charged) − (Stripe inbound fee). The fixed $0.30 dominates at small sizes.

| Top-up amount | Buyer pays (incl. 7%) | Stripe takes | **JungleGym net** | Margin |
|---|---|---|---|---|
| $5  | $5.35   | $0.46  | **−$0.11** | **negative** |
| $10 | $10.70  | $0.61  | **+$0.09** | 0.9% |
| $25 | $26.75  | $1.08  | **+$0.67** | 2.5% |
| $50 | $53.50  | $1.85  | **+$1.65** | 3.1% |
| $100 | $107.00 | $3.40  | **+$3.60** | 3.4% |
| $500 | $535.00 | $15.82 | **+$19.18** | 3.6% |

### Video purchase (per sale)

Destination charge with `application_fee_amount` = JungleGym's 20%. Stripe deducts its 2.9% + $0.30 from the application fee. Creator receives gross × 80% in their connected account.

| Tier (default rates × duration) | Buyer pays | Stripe takes | Creator's connected account | **JungleGym net** | Margin |
|---|---|---|---|---|---|
| Supported (5 min, $5.55) | $5.55 | $0.46 | $4.44 | **+$0.65** | 11.7% |
| Community (5 min, $11.11) | $11.11 | $0.62 | $8.89 | **+$1.60** | 14.4% |
| Abundance (5 min, $22.22) | $22.22 | $0.94 | $17.78 | **+$3.50** | 15.7% |
| Supported (10 min, $11.11) | $11.11 | $0.62 | $8.89 | **+$1.60** | 14.4% |
| Community (10 min, $22.22) | $22.22 | $0.94 | $17.78 | **+$3.50** | 15.7% |
| Abundance (10 min, $33.33) | $33.33 | $1.27 | $26.66 | **+$5.40** | 16.2% |
| Supported (30 min, $33.33) | $33.33 | $1.27 | $26.66 | **+$5.40** | 16.2% |
| Community (30 min, $66.66) | $66.66 | $2.23 | $53.33 | **+$11.10** | 16.6% |
| Abundance (30 min, $99.99) | $99.99 | $3.20 | $80.00 | **+$16.80** | 16.8% |

**Insight**: video purchase margin is *much better* than wallet top-up margin at every size — because the 20% platform fee easily absorbs Stripe's 2.9% + $0.30, even on small sales. **Video purchases are the main margin engine** for JungleGym; wallet top-ups are roughly self-financing.

### Creator pull-payout

JungleGym charges 2.5%, no Stripe fee on the platform→connected Transfer (free). Pure margin to JungleGym.

| Pull amount | Fee carved (2.5%) | **JungleGym net** |
|---|---|---|
| $10 | $0.25 | $0.25 |
| $25 | $0.625 | $0.63 |
| $50 | $1.25 | $1.25 |
| $100 | $2.50 | $2.50 |

Pull fee is 100% margin (no Stripe-side cost on the Transfer). Small revenue stream, but useful incentive against impatience.

---

## 4. Fixed-cost coverage — break-even math

Goal: cover the ~$31/mo fixed baseline + $2/mo per active creator.

### Scenario A — Day 1 / 1 active paid creator
Fixed costs = $31 + $2 = **$33/mo**

To cover $33/mo with **video purchases alone**, at avg margin of ~$1.60 per sale (community tier, 5-min):
- **~21 video purchases per month** (1 every 1.5 days)

Or with **wallet top-ups alone**, at avg $25 top-up netting $0.67:
- **~50 top-ups/mo** (1.7/day)

Or some mix. Realistic mix at Day 1: 10 video purchases ($16) + 25 top-ups ($17) = **break-even at this scale is achievable with a single active creator who gets a few sales a week**.

### Scenario B — 10 active paid creators
Fixed costs = $31 + (10 × $2) = **$51/mo**

- ~32 video purchases at community tier OR
- ~76 top-ups at $25 average

Realistic: 30 sales + 30 top-ups → ~$48 + $20 = **$68/mo revenue**, comfortable cushion.

### Scenario C — 50 active paid creators
Fixed costs = $31 + (50 × $2) = **$131/mo**

- ~82 video sales/mo at community tier, OR
- ~196 top-ups at $25, OR
- 50 sales + 100 top-ups = $80 + $67 = **$147/mo** ← break-even with margin

At this scale Cloudflare Stream costs become non-trivial. With ~50 active creators each delivering ~5 hours of streamed/recorded video per month to ~20 viewers each:
- Delivery: 50 × 5 × 60 × 20 = 300,000 minutes → **$300/mo** ← largest variable cost
- Storage: ~5,000 minutes total in CF Stream → **$25/mo**

**At scenario C with realistic streaming, Cloudflare bumps total costs to ~$456/mo.** Need ~285 video sales OR equivalent revenue mix to cover. Suddenly more aggressive.

### Scenario D — 200 active paid creators
Fixed Connect cost alone: **$400/mo**.
Cloudflare Stream at this scale (assume 200 creators × 8 hours/mo × 30 viewers): **$2,880/mo delivery**.
Plus Supabase Pro overage, R2 storage growth, etc.: **estimated total ~$3,500/mo costs.**

Need ~$3,500/mo revenue. At an average mix of $2 net per video sale and $1 net per top-up: 1,200 sales/mo + 1,000 top-ups/mo. Achievable, but margin is thin compared to costs at this stage. **This is where negotiated Stripe pricing and CF Stream volume discounts start to matter.**

---

## 5. Recommendations — actions to improve unit economics

Ordered by impact-to-effort ratio (highest first).

### 🟢 Low-hanging — ship soon
1. **Bump UI suggested top-up amounts** from $5/$10/$25 to $25/$50/$100. At $5 we currently lose money; at $25+ we make 2.5%+ margin. This is a one-file change in `WalletSection.tsx` and meaningfully shifts unit economics.
2. **Raise wallet top-up minimum** from $1 to $5 or $10. Same reasoning — small top-ups are a margin sink. Won't impact 99% of users (most top up $25+).
3. **Implement the platform fee-sweep cron** (option 3 in `payment-infra.md`). This isn't about saving money — it's about correctly tracking what's JungleGym revenue vs what's owed to creators, which is critical for accurate financial reporting (and 1099s eventually).

### 🟡 Medium effort — when growth justifies
4. **CF Stream → CF R2 + HLS for recorded videos** (not live streams). CF Stream is great but priced for live; once a video is recorded and just being served on-demand, R2-hosted MP4 + a player is dramatically cheaper at scale. Maybe 100x cheaper per delivered minute. Worth migrating once Stream delivery costs cross ~$200/mo.
5. **Cache aggressively at Cloudflare edge.** Video metadata, thumbnails, treehouse pages — all currently SSR'd. Adding stale-while-revalidate caching at the worker level reduces Worker CPU + Supabase reads dramatically. Free engineering win.
6. **Gift session platform fee** — currently 0%. If wallet-funded gifts grow significantly, charging even 5% on gifts would create a third real revenue stream. Trade-off is making the gift flow feel less generous; on-brand for JungleGym? Probably skip unless we need to.

### 🔴 High effort — only at significant scale
7. **Negotiated Stripe rates** — typically requires $1M+/yr volume. Could shave 0.5-1% off card processing.
8. **Stripe Connect Custom instead of Express** — saves $2/mo per active creator but forces JungleGym to handle onboarding, KYC, identity verification, 1099-K issuance. Big engineering project. Only worth it past 100+ active creators.
9. **ACH Direct Debit for top-ups** (~$0.80 capped at $5 vs 2.9% + $0.30) — great for big-spending users with bank accounts on file. Adds complexity (microdeposit verification) and 3–5 day settlement, killing impulse top-ups. Maybe a "pro user" option later.

### Don't do (at this scale)
- Stripe Issuing cards for creators
- Cryptocurrency
- Lowering the 7% top-up fee — already razor-thin
- Lowering the 20% platform fee — this is the actual margin engine

---

## 6. Stripe-side fees that creators see (pass-through, not JungleGym revenue)

For full transparency in the studio UI:

| Fee | Rate | When |
|---|---|---|
| Connected → bank payout | 0.25% + $0.25 | Every Stripe payout from creator's connected account to their bank (default daily for ACH) |
| Instant payout to debit card | 1.5% (min $0.50) | Only if creator chooses Instant in their Stripe Express dashboard |

These are deducted by Stripe directly from the creator's connected balance. JungleGym never sees this money flow. Disclosed in `GiftsReceivedSection` and `WithdrawButton` confirmation modal.

---

## 7. Open questions / things we don't know yet

- [ ] **Actual current Cloudflare bill** — do we have a baseline? Need Davis to check the CF Dashboard (with Davin's approval per CLAUDE.md rules)
- [ ] **Actual current Supabase usage** vs Pro tier limits
- [ ] **Average video duration** in production — drives default-tier price math; the tables above assume 5/10/30-minute videos
- [ ] **Average top-up size** — actual user behavior may already skew higher than $25 default
- [ ] **Conversion from "wallet has balance" → "gifts spent"** — high vs low? Determines how much top-up volume converts to creator-payout cycles (and the Connect $2/mo fee)
- [ ] **Refund and dispute rates** — at <1% we're fine, at 5%+ those $15 dispute fees would meaningfully hit margin

Add answers as data comes in.
