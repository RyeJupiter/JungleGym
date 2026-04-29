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

> **What's included in these tables:** **Stripe fees only.** The "JungleGym net" column is the gross fee we charged minus what Stripe took on that single transaction. It does **not** subtract a per-transaction allocation of Cloudflare, Supabase, or Connect monthly fees — those scale by volume / time, not per transaction, so they're tracked separately in section 2 and amortized in the break-even projections in section 4. Think of these tables as "the floor below which we couldn't break even no matter how cheap our infra was" — they show whether each transaction type is structurally viable on its own.

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

Where does the ~$3,500/mo come from? **Almost all of it is Cloudflare Stream delivery on the status-quo architecture.** Here's the line-by-line:

#### Status-quo costs (don't follow recommendation 4 — keep recorded video on CF Stream)

| Line item | Math | Monthly |
|---|---|---|
| Stripe Connect Express monthly active | $2 × 200 creators | **$400** |
| **CF Stream delivery** — assume each creator does 8 hours/mo of content (live + recorded) consumed by ~30 viewers each | (200 × 8 × 60 × 30) min ÷ 1,000 × $1 = 2.88M min ÷ 1,000 | **$2,880** |
| CF Stream storage — each creator has ~6 hours of video stored (treehouse intros + recorded sessions) | (200 × 6 × 60) min ÷ 1,000 × $5 | **$360** |
| Supabase Pro + DB/bandwidth overage at this scale | $25 base + ~$50 overage | **$75** |
| R2 storage (thumbnails, transcript chunks, VTT) | ~500 GB × $0.015 | **$8** |
| CF Workers + base infra | $5 base + minimal CPU | **$10** |
| Domain + misc | | **$2** |
| Email service (Resend at this scale) | ~50k tx emails/mo on Resend Pro | **$20** |
| Disputes (assume 0.3% of $40k gross) | ~8 × $15 | **$120** |
| **TOTAL — status quo** | | **~$3,875** |

So the real number is closer to ~$3,800, not $3,500. Streaming is ~84% of it. Connect is ~10%. Everything else is rounding error.

#### What it looks like AFTER recommendation 4 (migrate recorded video to R2 + HLS)

CF Stream stays for live sessions only. Recorded video gets served from R2 with free egress.

| Line item | Math | Monthly |
|---|---|---|
| Stripe Connect Express | unchanged | $400 |
| **CF Stream delivery — live only** — assume 2 hours/mo live per creator × 50 viewers | (200 × 2 × 60 × 50) min ÷ 1,000 × $1 = 1.2M min ÷ 1,000 | **$1,200** |
| CF Stream storage — minimal (live recordings auto-pruned or moved to R2) | ~200 × 1 hour × 60 ÷ 1,000 × $5 | **$60** |
| **R2 storage — recorded video** — 200 creators × ~10 videos × 500MB = 1TB | 1,000 GB × $0.015 | **$15** |
| **R2 egress — recorded video delivery** | $0 (always free) | **$0** |
| Supabase Pro + overage | unchanged | $75 |
| CF Workers + base | unchanged | $10 |
| Domain + misc | | $2 |
| Email service | | $20 |
| Disputes | | $120 |
| **TOTAL — with R2 migration** | | **~$1,902** |

That's a **~$2,000/mo savings at scale**, almost all of it on streaming costs. R2's free egress is the entire reason this migration is the highest-ROI infra optimization in the doc.

#### Sensitivity — what really moves the number

| Variable | Cheap version | Expensive version |
|---|---|---|
| Avg viewers per stream | 10 → $400 delivery | 100 → $4,000 delivery |
| Hours of content per creator | 4hrs → $1,400 delivery | 16hrs → $5,760 delivery |
| % live vs recorded | All recorded → almost free | All live → ~$3,000 delivery |

The big takeaways:
- **Live streaming is the cost driver, not "scale" itself.** A platform with 200 creators publishing recorded video has very low infra costs. A platform with 200 creators doing nightly live sessions to 50+ viewers each costs real money.
- **Migrating recorded video to R2 is the single biggest cost lever** we have at scale — better than negotiated Stripe rates, better than anything else.
- Connect's $2/mo per creator is real but not catastrophic — at 200 creators it's $400/mo, ~10% of total cost. We can absorb it with normal video purchase margin.

#### Revenue needed to break even — with R2 migration

~$1,900/mo. At an average mix of:
- 200 creators × avg 5 video sales / mo × $2 net / sale = $2,000 — comfortably covers
- Plus top-up revenue, plus pull-payout fees → comfortable margin

**At 200 creators with the R2 migration done, the platform should be solidly profitable.** Without it, we're scratching break-even and the streaming bill becomes the existential thing.

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

## 7. Admin financial review panel — build plan

The current `/admin?tab=metrics` shows transaction-level data and creator earnings. What's missing: **user-level behavior metrics** — the data that tells us whether the wallet model is actually working, where the float sits, and where to invest growth effort.

### Section A — Platform health summary cards
Single row of stat cards at the top:

| Card | Computation |
|---|---|
| **Wallet float held** | `SUM(wallets.balance)` — total dollars JungleGym is custodying right now |
| **Active wallet holders** | `COUNT(*) FROM wallets WHERE balance > 0` |
| **ARPU (last 30d)** | total fees collected (last 30d) ÷ unique paying users (last 30d) |
| **Repeat-buyer rate** | % of users with ≥2 purchases ever |
| **MAU paying** | unique users who paid (top-up or video) in last 30d |

### Section B — Buyer behavior
Aggregates from `wallet_transactions` + `purchases`:

| Card / Chart | Computation |
|---|---|
| **Avg top-up amount** | `AVG(amount)` from `wallet_transactions WHERE type='topup'` |
| **Median top-up amount** | percentile_cont(0.5) — better than avg for skewed distributions |
| **Top-up size distribution** | histogram: $1–10 / $10–25 / $25–50 / $50–100 / $100+ |
| **Avg wallet balance** | `AVG(balance) FROM wallets WHERE balance > 0` |
| **Median wallet balance** | percentile_cont(0.5) |
| **Avg lifetime spend / buyer** | total $ spent (purchases + gifts sent) ÷ unique buyers |
| **Wallet utilization rate** | $ gifted ÷ $ topped-up — what % of wallet money actually flows to creators? |
| **Time from top-up → first gift** | for users who top up specifically to gift; useful UX signal |

### Section C — Creator earnings
Already partially in `CreatorPayoutsSection`. Extend with:

| Card / Chart | Computation |
|---|---|
| **Avg earnings / paid creator (30d)** | `SUM(creator_amount) ÷ DISTINCT creator_id` over range |
| **Median earnings / paid creator** | percentile_cont(0.5) |
| **Earnings distribution** | bar chart — who earned $0–10 / $10–50 / $50–200 / $200+ |
| **Top 10 creators by earnings** | already exists, just confirm it's surfaced |
| **% of revenue from top 10%** | concentration signal — power-law check |
| **Avg payout size — scheduled vs pull** | from `creator_payouts` grouped by `mode` |

### Section D — Cost ratio (advanced)
Once we have actual Cloudflare + Supabase usage data:

| Card | Computation |
|---|---|
| **Effective Stripe cost / gross revenue** | sum of Stripe fees ÷ gross revenue |
| **Effective infra cost / gross revenue** | (CF + Supabase + Connect) ÷ gross revenue |
| **Net margin** | gross revenue − all costs |

Section D is blocked on actually pulling Cloudflare and Supabase billing into our DB — could be a manual monthly-snapshot job (a `monthly_cost_snapshots` table that an admin fills in). Don't over-engineer.

### Implementation notes
- All this lives on the existing `/admin?tab=metrics` page, just below the existing sections. Reuse `MetricsPanel` and extend `MetricsData`.
- No new tables needed for sections A–C; everything is computable from existing rows. A few queries will need `percentile_cont` (Postgres native) and date-range filters.
- Big queries (e.g. lifetime spend per user across all transaction types) should be materialized into a view or computed in a server-side `RPC` to avoid pulling all rows into the client.
- Charts can use a small library like `recharts` (React-native, ~30KB) or stick with simple HTML bars for histograms — match what's already loaded.
- Date-range selector that's already on the panel applies to behavior cards but NOT point-in-time numbers (wallet float, balance held).

### Build order
1. Add Postgres view or RPC for the heavy aggregates (per-user lifetime spend, per-creator lifetime earnings)
2. Extend `MetricsData` payload + admin route data fetch
3. Add Section A cards (highest-value, simplest)
4. Add Section B aggregates + size-distribution histogram
5. Add Section C extensions
6. Defer Section D until we have a way to pull infra billing into our system

**Estimated effort**: half-day for sections A–C combined, scoped tightly. Section D is open-ended.

---

## 8. Open questions / things we don't know yet

- [ ] **Actual current Cloudflare bill** — do we have a baseline? Need Davis to check the CF Dashboard (with Davin's approval per CLAUDE.md rules)
- [ ] **Actual current Supabase usage** vs Pro tier limits
- [ ] **Average video duration** in production — drives default-tier price math; the tables above assume 5/10/30-minute videos
- [ ] **Average top-up size** — actual user behavior may already skew higher than $25 default
- [ ] **Conversion from "wallet has balance" → "gifts spent"** — high vs low? Determines how much top-up volume converts to creator-payout cycles (and the Connect $2/mo fee)
- [ ] **Refund and dispute rates** — at <1% we're fine, at 5%+ those $15 dispute fees would meaningfully hit margin

Add answers as data comes in.
