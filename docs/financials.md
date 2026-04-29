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
| Cloudflare Stream — delivery | $1 per 1,000 minutes delivered | Live sessions + treehouse intro video playback |
| Cloudflare Stream — storage | $5 per 1,000 minutes stored / month | Only treehouse intro videos — live sessions are not stored, so this line is tiny |
| Cloudflare R2 — storage | $0.015 / GB-month | Currently audio chunks + VTT (transcripts bucket); could expand |
| Cloudflare R2 — egress | $0 | Free egress is the whole reason we're on R2 |
| **Supabase Storage — storage** | $0.021 / GB-month above 100GB included | Creator-uploaded paid videos, thumbnails — the main video catalog |
| **Supabase Storage — egress** | $0.09 / GB above 250GB included | Bandwidth on the paid video catalog. The actual scale-cost concern, not CF Stream storage. |
| Supabase — database / DB bandwidth | varies | Pro tier $25/mo base; overage modest at our query volume |
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

> **Architecture note up front (clarified 2026-04-29)**: live session recordings are **not stored** by JungleGym — they're ephemeral. Creator-uploaded paid videos live on **Supabase Storage**, not CF Stream. CF Stream is used only for (a) live ingest+delivery during sessions and (b) short treehouse intro videos. This changes which costs matter at scale.

#### The real line-by-line cost at 200 creators

Assumes the streaming-tier system from section 5a is in place (otherwise the live-streaming line is uncapped — see "without tier limits" below).

| Line item | Math | Monthly |
|---|---|---|
| Stripe Connect Express monthly active | $2 × 200 creators | **$400** |
| **CF Stream delivery — live sessions only** — say avg 4 hrs/mo per creator × 30 viewers (most creators are Sprout/Seedling, light streaming) | (200 × 4 × 60 × 30) min ÷ 1,000 × $1 = 1.44M min ÷ 1,000 | **$1,440** |
| CF Stream storage — treehouse intro videos only (~60s × 200 creators) | ~200 min ÷ 1,000 × $5 | **$1** |
| Supabase Storage — paid video catalog | ~400 GB × $0.021 (Pro tier overage) | **$6** |
| Supabase bandwidth — paid video egress (sales + previews) | ~500 GB egress, 250 GB included → 250 × $0.09 | **$23** |
| Supabase Pro base + DB | $25 + minimal overage | **$30** |
| CF Workers + base infra | $5 base + minimal CPU | **$10** |
| Domain + misc | | **$2** |
| Email service (Resend at this scale) | ~50k tx emails/mo on Resend Pro | **$20** |
| Disputes (assume 0.3% of $40k gross) | ~8 × $15 | **$120** |
| **TOTAL** | | **~$2,052** |

That's significantly under my earlier $3,500 estimate. The big delta: I was assuming recorded videos were on CF Stream and racking up massive delivery + storage charges. They're on Supabase, and Supabase's bandwidth at this scale is ~$23/mo, not the hundreds I implied.

**Live streaming delivery is still the dominant variable cost** (~70% of the bill), but the streaming-tier system caps it at predictable values per creator.

#### Without the streaming-tier system (the worst-case spiral)

If we don't ship section 5a's tier limits, a single enthusiastic non-monetizing creator can shift the math dramatically. Worst-case projection assuming 20 creators each stream 40 hrs/mo to 50 viewers without the tier system:

| Line item | Math | Monthly |
|---|---|---|
| CF Stream delivery — uncapped pathological case | (20 × 40 × 60 × 50) ÷ 1,000 × $1 | **$2,400** for those 20 alone |
| Plus the rest of the 180 creators streaming reasonably | as above | $1,440 |
| Plus all other costs | as above | $612 |
| **TOTAL — worst case without tiers** | | **~$4,452** |

Tier system caps this risk asymmetry; without it, a few users can outpace their entire revenue contribution.

#### Sensitivity — what moves the number most

| Variable | Cheap version | Expensive version |
|---|---|---|
| Avg viewers per live stream | 10 → $480 delivery | 100 → $4,800 delivery |
| Avg live hours per creator | 1hr → $360 delivery | 8hrs → $2,880 delivery |
| Storage on Supabase vs R2 | Supabase: $29 storage+egress | R2: $6 (savings exist but small) |

The big takeaways:
- **Live streaming is the only thing that scales steeply.** Recorded video delivery via Supabase Storage is comparatively cheap; CF Stream delivery is volume × viewers × hourly minutes.
- **Streaming-tier limits (section 5a) are the highest-impact cost lever we have.** Without them the math is unbounded; with them the cost is predictable per creator.
- Connect's $2/mo per creator is ~20% of total cost at this scale. Real but not catastrophic.
- **R2 migration of paid video catalog from Supabase Storage** is now a smaller win — saves ~$23/mo at this scale (just bandwidth elimination). Still worth doing eventually for the free-egress headroom, but not the existential lever I made it out to be.

#### Revenue needed to break even — with tier system in place

~$2,000/mo. At an average mix of:
- 200 creators × avg 5 video sales / mo × $2 net / sale = $2,000 — comfortably covers
- Plus top-up revenue, plus pull-payout fees → comfortable margin

**At 200 creators with the streaming tier system shipped, the platform should be solidly profitable.** Without it, the per-creator cost ceiling is uncapped and a few outliers can outpace their revenue contribution.

---

## 5. Recommendations — actions to improve unit economics

Ordered by impact-to-effort ratio (highest first).

### 🟢 Low-hanging — ship soon
1. **Bump UI suggested top-up amounts** from $5/$10/$25 to $25/$50/$100. At $5 we currently lose money; at $25+ we make 2.5%+ margin. This is a one-file change in `WalletSection.tsx` and meaningfully shifts unit economics.
2. **Raise wallet top-up minimum** from $1 to $5 or $10. Same reasoning — small top-ups are a margin sink. Won't impact 99% of users (most top up $25+).
3. **Implement the platform fee-sweep cron** (option 3 in `payment-infra.md`). This isn't about saving money — it's about correctly tracking what's JungleGym revenue vs what's owed to creators, which is critical for accurate financial reporting (and 1099s eventually).

### 🟡 Medium effort — when growth justifies
4. **Migrate paid video catalog from Supabase Storage → CF R2.** R2 has free egress; Supabase charges $0.09/GB above 250GB. Storage rates are similar ($0.015 R2 vs $0.021 Supabase). At low scale this is ~$0/mo difference; at 200-creator scale, ~$23/mo savings; at 1000-creator scale, hundreds per month. Worth migrating once Supabase bandwidth bills cross ~$50/mo, or when we want predictable cost-of-egress for accounting. Implementation: rewrite the upload path to PUT to R2, generate signed URLs for purchaser playback (R2 supports presigned URLs natively), backfill existing videos in a one-shot job.
5. **Cache aggressively at Cloudflare edge.** Video metadata, thumbnails, treehouse pages — all currently SSR'd. Adding stale-while-revalidate caching at the worker level reduces Worker CPU + Supabase reads dramatically. Free engineering win.
6. **Tiered live-streaming hour limits per creator** (see section 5a below for full design). Caps the worst-case streaming bill from low-earning creators while letting high-earners scale freely. Single biggest control on cost runaway risk.
7. **Gift session platform fee** — currently 0%. If wallet-funded gifts grow significantly, charging even 5% on gifts would create a third real revenue stream. Trade-off is making the gift flow feel less generous; on-brand for JungleGym? Probably skip unless we need to.

### 🔴 High effort — only at significant scale
8. **Negotiated Stripe rates** — typically requires $1M+/yr volume. Could shave 0.5-1% off card processing.
9. **Stripe Connect Custom instead of Express** — saves $2/mo per active creator but forces JungleGym to handle onboarding, KYC, identity verification, 1099-K issuance. Big engineering project. Only worth it past 100+ active creators.
10. **ACH Direct Debit for top-ups** (~$0.80 capped at $5 vs 2.9% + $0.30) — great for big-spending users with bank accounts on file. Adds complexity (microdeposit verification) and 3–5 day settlement, killing impulse top-ups. Maybe a "pro user" option later.

### Don't do (at this scale)
- Stripe Issuing cards for creators
- Cryptocurrency
- Lowering the 7% top-up fee — already razor-thin
- Lowering the 20% platform fee — this is the actual margin engine

---

## 5a. Tiered live-streaming hour limits — full design

Recommendation 6 in detail. Live streaming is the existential cost driver at scale (see Scenario D), and most of that cost is generated by a long tail of low-earning creators. A creator who streams 8 hours/mo to 50 viewers but earns $0 in JungleGym fees costs us ~$24/mo in pure expense. At 50 such creators that's $1,200/mo of pure loss.

Goal: cap the worst-case streaming bill from creators who haven't yet earned their way to higher allowances, while never gating a *successful* creator. Tiers should feel earned, not punitive.

### Proposed tier structure

Tiers are based on **trailing-30-day JungleGym fee revenue from that creator** (purchases × 20% + any gift activity tied to their streams). Recompute the tier daily; a creator's tier moves up automatically as they grow.

| Tier | Fee revenue (trailing 30d) | Live hours/mo allowed | Approx max CF cost / creator | JungleGym net at avg sales |
|---|---|---|---|---|
| **Sprout** (default for new) | $0 | **3 hrs** | $9/mo (50 viewers × 60min × 3hrs × $0.001) | likely net loss; runway tier |
| **Seedling** | $1–$25 | **10 hrs** | $30/mo | net positive |
| **Sapling** | $25–$100 | **30 hrs** | $90/mo | comfortably positive |
| **Treehouse** | $100–$500 | **75 hrs** | $225/mo | comfortably positive |
| **Canopy** | $500+ | **unlimited** | uncapped | streaming bill is rounding error vs revenue |

**Numbers chosen so each tier's max streaming cost is roughly half the tier's fee revenue** — generous, but never inverted.

### What "live hour" means

- 1 live hour = 60 minutes of *active* WebRTC ingest, regardless of viewer count
- We already track `paused_at` and the 15-min auto-end timer, so "active minutes" is well-defined
- Pausing the stream pauses the meter (the existing track-swap pause sends silent video, doesn't bill ingest minutes — but to keep the math simple, just stop the meter on pause)
- A scheduled session that nobody attends still consumes the creator's quota if it goes live (creators can cancel before going live — already supported)

### Enforcement points

1. **Soft warning at 75% of monthly quota** — email + studio banner. Creator knows what's coming.
2. **Hard block at 100%** — `/api/stream/provision` refuses to issue a new WHIP URL with a tier-aware error response. Existing in-flight streams are NOT cut off mid-broadcast (would be a terrible experience); they finish naturally and the next one is blocked.
3. **Reset on the 1st of each month** at 00:00 UTC, same cron infra as the payout cron.

### Schema additions

```sql
CREATE TABLE public.creator_stream_quotas (
  creator_id          UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  tier                TEXT NOT NULL DEFAULT 'sprout'
    CHECK (tier IN ('sprout', 'seedling', 'sapling', 'treehouse', 'canopy')),
  minutes_used_period INT NOT NULL DEFAULT 0,
  period_start        TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', NOW()),
  trailing_30d_revenue NUMERIC(10, 2) NOT NULL DEFAULT 0,
  recomputed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Plus a small extension to `live_sessions` to track per-session minute counts:
```sql
ALTER TABLE public.live_sessions
  ADD COLUMN active_minutes INT NOT NULL DEFAULT 0;
```

### Implementation pieces

1. **Daily tier-recompute cron** — `POST /api/cron/recompute-stream-tiers`
   - For each creator: sum trailing-30-day fee revenue (`purchases.platform_amount` from their videos + `creator_payouts.fee` for any pulls if we're counting that)
   - Look up tier from the table above, update `creator_stream_quotas.tier`
   - GH Actions workflow: daily at 03:30 UTC

2. **Monthly minute-reset cron** — same workflow as the payout cron, runs on the 1st at 00:00 UTC
   - `UPDATE creator_stream_quotas SET minutes_used_period = 0, period_start = NOW()`

3. **Quota check at stream provision** — `/api/stream/provision`
   - Read creator's tier and minutes_used
   - If at or over the cap → return 402 with structured error `{ kind: 'quota_exceeded', tier, minutesAllowed, minutesUsed }`
   - UI surfaces a friendly upgrade-path message

4. **Minute counting** — extend the existing CF Stream webhook handler
   - When a stream's status transitions to `connected`, start counting
   - When it transitions to `disconnected` (real end, not pause), close out and add to `creator_stream_quotas.minutes_used_period` + `live_sessions.active_minutes`
   - Pause/resume already drives `paused_at`; just bracket the meter on those events

5. **Studio UI** — small "Streaming hours this month" widget on `/studio/sessions/new` and the live session manage page
   - Shows current tier, minutes remaining, next-tier threshold ("$15 more in earnings → Seedling tier (+7 hours)")
   - Builds aspiration, not gating frustration

6. **Admin override** — column on the existing admin creator detail page to manually bump tier or reset minutes for edge cases (creator just had a viral session, etc.)

### Edge cases to think through

- **Creator about to release a paid course / start a live workshop**: do they need to grandfather extra minutes upfront? Probably handle case-by-case via admin override; codifying isn't worth the complexity.
- **A single very-popular live session blowing the quota in one go**: ~50 hrs of viewing time at ~50 viewers = $150 cost. Sprout creator with no fee revenue costs us $150 once. Annoying but not catastrophic, and the next session is blocked — the cap kicks in *after* the over-burn. To prevent this: also check quota at session start, and warn the creator their tier won't cover an X-hour scheduled session (they can shorten or upgrade).
- **Tier downgrades on a slow month**: avoid yo-yo. Consider applying tier *increases* instantly but tier *decreases* only after 60 days at the lower revenue band. Generous on the way down.

### Build order

1. Schema migration (`creator_stream_quotas` + `live_sessions.active_minutes`)
2. Tier-recompute cron (no enforcement yet — just observe what tier each creator would be in)
3. Minute-counting in the CF Stream webhook
4. **Soft launch** — surface the widget in the UI, send warnings, but don't block. Lets us see real distributions before flipping enforcement on.
5. Hard enforcement at `/api/stream/provision`
6. Admin override UI

**Estimated effort**: ~1 day for schema + cron + counting + soft-launch UI. Hard enforcement is a half-hour after soft-launch data confirms the tier numbers are sane.

### What this gets us

- **At Scenario D scale (200 creators)**: roughly 80% of creators stay in Sprout/Seedling tiers (most don't earn much). Their combined max cost = 200 × 0.8 × $30 = ~$4,800/mo *worst case* if they all maxed. Realistically much less. The top 20% (Treehouse / Canopy) would account for 90% of streaming volume, but they're paying for it via revenue.
- **Risk asymmetry fixed**: today, an enthusiastic but non-monetizing creator can singlehandedly cost more than they earn. Tiers make that impossible by definition.
- **Aspiration mechanic**: the tier names + visible-progress UI become a soft growth motivator. Creators want to climb to "Treehouse" or "Canopy" — that's worth more than the cost-control alone.

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
