# Payment Infrastructure

End-to-end reference for how money flows through JungleGym, where the gaps are, and the plan to close them. Living document — update when behavior changes.

---

## Money flows today

### 1. Video purchase (working — auto-routed)
Buyer pays via inline Stripe Payment Element on `/video/[id]/checkout`.

- If creator has a connected Stripe account: **destination charge** with `application_fee_amount` (20%) + `transfer_data.destination = creator.stripe_account_id`. 80% lands in creator's connected account; 20% in JungleGym's platform balance.
- If creator is **not** connected: charge lands 100% in JungleGym's platform balance. JungleGym owes the creator their 80% out-of-band.

### 2. Live-session gift via wallet (gap — see below)
Two-step flow that decouples Stripe charges from gift sends to dodge per-gift fees.

**Top-up** (`/api/wallet/topup` → `.../confirm`):
1. User picks `$X` → Stripe PI for `$X + 7% fee` (charge to **JungleGym platform balance**, no `transfer_data`)
2. Confirm route credits `wallets.balance` and writes a `topup` ledger row
→ Cash sits in JungleGym Stripe balance. User has a prepaid balance in our DB.

**Gift** (`/api/wallet/gift`):
1. Atomic debit on giver's `wallets.balance` (optimistic lock)
2. Insert `gifts` row — `creator_amount = X`, `platform_amount = 0`
3. Insert `wallet_transactions` row, type `gift_sent`, amount `-X`

What's **not** happening:
- ❌ No credit to creator's `wallets.balance`
- ❌ No `gift_received` row written (the enum value exists in `00019_wallets.sql:5` but no code path inserts one)
- ❌ No Stripe Transfer to creator's connected account
- ❌ No `transfer_data` (impossible — cash already cleared at top-up; gift time has no live charge to attach to)

**Where gift money sits:** JungleGym platform balance. Indefinitely. The `gifts` table is the only record of obligation. `/admin?tab=metrics` → `CreatorPayoutsSection` sums it for a human to read.

---

## Stripe fees (confirmed against [stripe.com/connect/pricing](https://stripe.com/connect/pricing) — re-verify if a year passes)

| Item | Fee | Who pays |
|---|---|---|
| Domestic card charge | 2.9% + $0.30 | JungleGym (deducted from gross before settlement) |
| International card surcharge | +1.5% | JungleGym |
| Currency conversion | +1% | JungleGym |
| Disputes / chargebacks | $15 | JungleGym (refunded if dispute won) |
| **Stripe Connect Express — monthly active account** | **$2/mo per active connected account** | **JungleGym** |
| **Connected → bank payout** | **0.25% + $0.25 per payout** | **Connected account** (deducted from creator's balance) |
| Instant payout (connected account → debit card) | 1.5% (min $0.50) | Connected account |
| Platform → connected account Transfer | Free | — |

**What this means for our flows — does the 7% top-up fee actually cover Stripe?**

Walking through the math, since this is load-bearing:

| Top-up | User pays (incl. 7%) | Stripe takes (2.9% + $0.30) | Wallet credit | **JungleGym net** | Margin |
|---|---|---|---|---|---|
| $25  | $26.75  | $1.08  | $25.00  | **$0.67** | 2.5% |
| $100 | $107.00 | $3.40  | $100.00 | **$3.60** | 3.4% |
| $500 | $535.00 | $15.82 | $500.00 | **$19.18** | 3.6% |

The 7% top-up fee covers Stripe's inbound processing with ~3% net margin. Sending a gift from wallet has **no additional fee** (no platform cut, no Stripe touch — it's just a DB row). The Stripe Transfer at payout time is **$0**. So the only frictional cost between top-up and creator payout is Stripe's original card-processing fee, already amortized at top-up time.

**Pull-payout fee (2.5%)** is pure convenience markup — the creator is paying for "off-cycle" access to their balance, not for Stripe overhead. Goes straight to JungleGym revenue.

**Net summary**: JungleGym only sees fee revenue from two sources on the gift flow:
1. **Wallet top-up fee (7%)** — buyer pays at top-up time
2. **Pull-payout fee (2.5%)** — creator pays only if they want their money before the 1st of next month

Sending a gift, receiving a gift, and the monthly auto-payout are all free **at the JungleGym layer**.

> **Stripe layer fees that creators see — pass-through, not JungleGym revenue:**
> - **0.25% + $0.25** per connected→bank payout (deducted from the creator's balance by Stripe)
> - This applies to BOTH the free monthly auto-payout and the pull payout. Disclosed in the studio UI.
>
> **Stripe layer fee that JungleGym pays:**
> - **$2/mo per active connected creator** (Connect Express). Active = received any payout that month. At our scale this is amortized across the 7% top-up margin; at higher scale (50+ paid creators/month) it's a real expense to track. Sensitive to whether creators get monthly payouts vs holding balance for pulls.

### Where the money lives — and why payout schedule matters

Three separate balance layers, each with different rules:

1. **JungleGym Stripe platform balance** — receives every top-up after Stripe takes its cut. Has a "pending" sub-balance (new charges, typically 2–7 days for cards) and "available" sub-balance. Only available funds can be Transferred to creators or paid out to JungleGym's bank.
2. **Creator's connected Stripe account balance** — receives our Transfers. Stripe automatically pays this out to the creator's bank on the connected account's own schedule (daily by default). **Stripe charges 0.25% + $0.25 on this payout, deducted from the creator's balance.** Per Stripe Connect pricing, no longer free.
3. **JungleGym's bank account** — populated by Stripe's automatic platform-balance payout schedule (daily T+2 by default).

> **Recommended platform setting: manual payouts to JungleGym bank.**
>
> If Stripe is auto-paying-out platform balance to the JungleGym bank every day, then by the time a creator triggers a payout the cash may already have left Stripe — we'd need either a working capital buffer in the bank account, or to pull funds back into Stripe (slow + manual).
>
> Setting the platform account's payout schedule to **Manual** (Stripe Dashboard → Settings → Payouts) keeps top-up cash sitting in Stripe's available balance, ready to be transferred to creators **for free** at cron or pull time. JungleGym then manually pays itself out whenever cash is needed for ops.
>
> Tradeoff: someone has to remember to do the manual payout. Worth it for the simpler accounting story.
>
> **TODO**: Rye to flip platform payout schedule to Manual once he reviews the cash flow implications. Listed in the open-questions section.

---

## Design decision: gift earnings live separate from the wallet

We do **not** credit creators' `wallets.balance` when they receive a gift. The wallet remains a single-purpose pool: "money I put in via top-up to gift other creators." Mixing in gift earnings would force us to answer "can a creator spend gift income to gift someone else?" — which is rare in practice, complicates fee accounting, and muddies the audit story for IRS-relevant 1099 reporting.

Instead:
- **`gifts` table is the source of truth for receive-side earnings.** Each row is an immutable obligation from JungleGym to the creator until settled by a Stripe Transfer.
- **`/studio/gifts-received` (or a section in studio)** reads directly from `gifts` filtered by creator + settled status. Shows lifetime gross, unsettled balance, settlement history.
- **`wallet_transactions` never gets a `gift_received` row.** The `gift_received` enum value in `00019_wallets.sql:5` becomes dead but harmless — no migration needed to drop it.
- **Wallet UI explicitly notes** "This balance is for gifting other creators. Gifts you receive are tracked separately under Gifts Received." — so creators don't expect their gift income to show up in their giver-side wallet.

Tradeoff: a creator who wants to gift another creator must wait for monthly payout → bank → top-up. Vanishingly rare and acceptable. Pull mode mitigates it for creators who actually need it.

## The gap: gift money is not routed

Per-gift destination charges aren't possible (top-up settled the funds long ago). To pay creators their gift balance we need a **separate transfer flow** triggered from JungleGym's platform balance to each creator's connected account.

**Non-issue: unsettled gifts to non-onboarded creators.** Live streaming is gated on Stripe Connect onboarding, so a creator can't receive a gift before they're set up to be paid out. No queueing logic required.

### Plan: scheduled monthly + on-demand pull

**Both modes carve a fee from the creator's payout.** The fee covers Stripe overhead so JungleGym doesn't subsidize it.

#### Option B — scheduled monthly payout (default) — IMPLEMENTED
- Cron runs the 1st of each month at 04:00 UTC (`.github/workflows/payout-creator-gifts.yml`)
- For each creator with `unsettled_gift_balance >= PAYOUT_MIN_AMOUNT`:
  - Sum their unsettled `gifts.creator_amount` rows
  - **Free to creator** — no fee is carved. The 7% wallet top-up fee + the platform fee on session gifts already cover JungleGym's Stripe processing costs on the way IN; the platform→connected Transfer is $0 at Stripe layer; nothing left to charge.
  - Create one `stripe.transfers.create({ amount, destination })` per creator with idempotency key `payout:scheduled:{creatorId}:{YYYY-MM}`
  - Mark every gift in the batch with `settled_at = now()` + `transfer_id = tr_…`
- Threshold prevents tiny payouts. Set to **$10 minimum** — anything below rolls to next month.

#### Option C — on-demand pull (creator-initiated) — IMPLEMENTED
- Studio "Withdraw" button on the Gifts received section. Creator can request anytime their unsettled balance ≥ minimum.
- Fee: **2.5% flat** — small convenience charge that nudges most creators toward the free monthly cadence.
- Same flow: bundle unsettled gifts → create Transfer with `payout:pull:{creatorId}:{Date.now()}` idempotency → mark settled.
- Rate limit: **1 pull per 7 days per creator** (enforced by checking the most recent `mode='pull'` row in `creator_payouts`).

#### Fee numbers — current values (live in `packages/shared/src/utils/pricing.ts`)
| Mode | Fee | Rationale |
|---|---|---|
| Scheduled monthly | **Free** | All Stripe overhead is already covered by the 7% top-up fee and 20% platform fee on session gifts |
| On-demand pull | **2.5% of gross** | Small convenience charge for off-cycle withdrawals |
| Min payout threshold | **$10** | Prevents tiny payouts |
| Pull rate limit | **7 days** | Protects against accidental double-clicks |

---

## Is this the best setup we can build right now?

Honest answer: **mostly yes, with two refinements possible.** Card processing is the dominant cost we can't escape, and the architecture around it is already pretty tight.

**What's structurally optimal:**
- The wallet model amortizes Stripe's 2.9% + $0.30 across many gifts. A naive "fresh charge per gift" architecture would lose 9%+ on a $5 gift; the wallet drops effective fees to <1% on equivalent volume. This is the single biggest leverage point and we already have it.
- Destination charges with `transfer_data` for video purchases route the 80/20 split atomically — no intermediate balance to babysit, no separate Transfer call. Industry-standard for Connect platforms.
- The fee-sweep cron architecture (option 3) keeps creator-obligation buffer in Stripe so no Transfer can ever fail for liquidity. Cleaner than auto-payout.
- Our 7% top-up fee covers Stripe's inbound 2.9% + $0.30 with ~3% margin (see math table above). Tight but real.

**Where there's room:**

1. **UI nudge toward larger top-ups.** The fixed $0.30 inbound fee hits small top-ups disproportionately:

   | Top-up | Stripe takes | JungleGym net | Net margin |
   |---|---|---|---|
   | $5 | $0.45 | -$0.10 | **negative** |
   | $10 | $0.59 | $0.11 | 1.1% |
   | $25 | $1.08 | $0.67 | 2.5% |
   | $50 | $1.85 | $1.65 | 3.1% |
   | $100 | $3.40 | $3.60 | 3.4% |

   At **$5 top-ups we lose money** after Stripe. Easy fix: bump the UI default suggestion from $5/$10 → $25/$50, and consider raising the wallet top-up minimum from $1 to $5 or $10. Doesn't break anything but improves unit economics on small users.

2. **The $2/mo Connect Express fee is unavoidable** as long as we use Express. Switching to Connect Custom would save the $2/mo but force JungleGym to manage onboarding, identity verification, and tax forms ourselves — adds engineering burden out of proportion to the savings until we have hundreds of paid creators per month.

**What we're NOT doing (and shouldn't, at this scale):**
- ACH Direct Debit for top-ups (capped at $5 vs 2.9% + $0.30) — would save money but adds 3-5 day settlement and microdeposit verification, killing the impulse-gift use case
- Stripe Issuing cards for creators (avoids the connected→bank fee entirely) — too complex and creators don't want a special card
- Negotiated platform pricing with Stripe — typically requires $1M+/yr volume; revisit when we get there

**Break-even check at low scale:** Yes, we can break even, but barely. If we have 20 active creators paid out monthly = $40/mo Connect cost. To cover that with the 7% top-up fee we need ~$1,200/mo in top-ups (at avg $25 top-up size). Achievable but not abundant. **The path to comfortable margin is volume, not fee tuning.**

---

## Auto-sweeping fees to JungleGym's bank account

**Question that came up**: can we keep the gift-balance funds inside Stripe and only auto-transfer JungleGym's fee revenue to the bank?

**Reality check**: Stripe doesn't actually segment the platform balance by purpose. Top-up cash, video purchase platform fees, and pull-payout fees all land in **one** number called the "platform balance." The "$X owed to creators" lives only in our DB (sum of `gifts.creator_amount WHERE settled_at IS NULL`). Stripe has no idea which dollars are "creator obligations" vs "JungleGym revenue" — it's all one pool.

So "keep gift balance in Stripe but sweep fees out" is conceptually a JungleGym-side accounting choice, not a Stripe-side feature.

**Three workable architectures**:

1. **Auto-payout, full sweep daily** *(default Stripe behavior — REJECTED)*
   Stripe pays out the entire available platform balance to JungleGym's bank every day. Simple, hands-off. Risk: if a creator transfer fires when the platform balance is briefly low (mid-payout window), it'd fail with `insufficient_funds_in_balance`. We'd be relying on the pending-balance buffer + new top-ups to cover.

2. **Manual platform payouts** *(set in Stripe Dashboard — REJECTED)*
   All cash sits in Stripe indefinitely. Requires human discipline; cash sits idle without a sweep mechanism.

3. **Manual schedule + automated fee-sweep cron — CHOSEN, TO BE BUILT**
   Platform is set to Manual payouts in Stripe Dashboard, then a weekly cron handles the sweep automatically. This is the architecture Davis is committing to, deliberately, so:
   - Creator-obligation funds (unsettled gift balance) always have a Stripe-side buffer ready for instant Transfers
   - JungleGym's fee revenue still flows out on a predictable cadence
   - Accounting story is clean: payouts to JungleGym bank correspond exactly to fees earned, not to "everything that happened to be available"

   **Build spec (queued — not yet written, do this after the current PR merges):**
   - New cron route `POST /api/cron/sweep-platform-fees`
     - Bearer auth on `CRON_SECRET` (same pattern as the other crons)
     - Computes `feesSince(lastSweep)` = topup fees + purchase platform fees + pull-payout fees + any session-gift platform fees (currently $0 but defensive)
     - Calls `stripe.payouts.create({ amount, currency: 'usd' })` against the platform account → JungleGym's bank
     - Idempotency key: `fee-sweep:{ISO-week}` so re-runs in the same week don't double-sweep
   - New table `platform_fee_sweeps`:
     ```sql
     CREATE TABLE public.platform_fee_sweeps (
       id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       stripe_payout_id TEXT NOT NULL UNIQUE,
       amount          NUMERIC(10, 2) NOT NULL,
       window_start    TIMESTAMPTZ NOT NULL,
       window_end      TIMESTAMPTZ NOT NULL,
       breakdown       JSONB NOT NULL,         -- { walletTopup, purchase, pullPayout }
       status          TEXT NOT NULL DEFAULT 'pending'
         CHECK (status IN ('pending', 'paid', 'failed', 'reversed')),
       created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
     );
     ```
   - New webhook cases: `payout.paid` for the platform account → status='paid'; `payout.failed/canceled` already handled but currently treated as creator-payout failures — split logic to differentiate by destination (connected vs platform)
   - GH Actions workflow `.github/workflows/sweep-platform-fees.yml` — weekly trigger, e.g. `0 5 * * 1` (Monday 05:00 UTC)
   - Admin UI: a small "Recent fee sweeps" panel on `/admin?tab=metrics` with sweep date / amount / status / breakdown
   - **Pre-build prerequisite**: Rye must flip platform payout schedule to Manual in the Stripe Dashboard. Otherwise Stripe is auto-paying alongside our cron — chaos.

   **Estimated effort**: ~one afternoon, including the migration, webhook split, and admin UI.

> **Visibility into all this** is now wired into the admin Metrics tab:
> - "Owed to creators" — sum of unsettled gifts (point-in-time)
> - "Total fees collected" — sum of (topup fees + purchase platform fees + pull-payout fees), range-filtered
> - "Net (collected − owed)" — rough JungleGym margin
> - Plus a per-source fee breakdown table

---

---

## Stripe ↔ DB reconciliation (fraud-proofing)

Every dollar that enters or leaves a JungleGym wallet should be **provably tied to a Stripe object** so we can audit at any point and detect tampering or bugs.

### Already wired (Stripe webhook `route.ts`)
- `checkout.session.completed`, `customer.subscription.created/updated/deleted`
- `invoice.paid` / `payment_succeeded` / `payment_failed`
- `payment_intent.succeeded` / `payment_intent.payment_failed`
- `charge.dispute.created` (→ admin issue)
- `charge.refunded` (→ admin issue)
- `payout.failed` / `payout.canceled` (→ admin issue, error severity — creator money stuck)
- `account.updated` (Connect onboarding state)

### Missing — need to add
| Event | Why we want it |
|---|---|
| `charge.succeeded` | Captures `balance_transaction` ID + actual Stripe-side fee, so we can reconcile gross vs net per top-up |
| `charge.failed` | Confirm a known-failed top-up never accidentally credits a wallet |
| `transfer.created` | Confirm our scheduled/pull payouts actually hit Stripe (insurance against silent failure between our DB and Stripe) |
| `transfer.failed` / `transfer.reversed` | Roll back the `gifts.settled_at` + transfer_id so the balance becomes withdrawable again |
| `transfer.updated` | State transitions (paid, in_transit) for visibility |
| `payout.paid` | Confirm bank-side settlement (creator's connected account → their bank) — useful for "your $X arrived in your bank" notifications |
| `radar.early_fraud_warning.created` | Stripe flags likely fraud before a dispute hits — early warning for high-risk top-ups |

### Schema additions

#### 1. `stripe_events` — append-only audit log of every webhook
```sql
CREATE TABLE public.stripe_events (
  id              TEXT PRIMARY KEY,                   -- Stripe event ID (evt_…) — natural unique key, idempotency built in
  type            TEXT NOT NULL,
  payload         JSONB NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  processing_error TEXT
);
CREATE INDEX idx_stripe_events_type ON public.stripe_events(type);
CREATE INDEX idx_stripe_events_received ON public.stripe_events(received_at);
```
Webhook handler writes the event row first (with `id` = Stripe's `evt_…`); duplicate webhook deliveries hit the PK and short-circuit. Marks `processed_at` after handler succeeds.

#### 2. Tighten `wallet_transactions` provenance
Add nullable columns linking every credit to its Stripe origin:
```sql
ALTER TABLE public.wallet_transactions
  ADD COLUMN stripe_payment_intent_id TEXT,
  ADD COLUMN stripe_charge_id         TEXT,
  ADD COLUMN stripe_balance_tx_id     TEXT;        -- the actual settled-funds id
CREATE UNIQUE INDEX uq_wallet_tx_pi
  ON public.wallet_transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
```
With this, **no wallet credit can exist without a Stripe-confirmed charge.** The current `description = 'topup:pi_…'` idempotency hack moves into a real column with a real unique constraint. Backfill existing rows from the description before enforcing.

#### 3. Settlement columns on `gifts`
```sql
ALTER TABLE public.gifts
  ADD COLUMN settled_at        TIMESTAMPTZ,
  ADD COLUMN transfer_id       TEXT,
  ADD COLUMN settlement_fee    NUMERIC(10, 2),     -- the fee carved out of this gift's share
  ADD COLUMN settlement_mode   TEXT                 -- 'scheduled' | 'pull'
    CHECK (settlement_mode IN ('scheduled', 'pull'));
CREATE INDEX idx_gifts_unsettled
  ON public.gifts(creator_amount)
  WHERE settled_at IS NULL;        -- drives the cron's "what's owed?" query cheaply
```

#### 4. Optional `creator_payouts` summary table
Aggregate row per `transfer_id` so admin UI doesn't have to GROUP BY on every render:
```sql
CREATE TABLE public.creator_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES public.users(id),
  transfer_id     TEXT NOT NULL UNIQUE,
  amount_paid     NUMERIC(10, 2) NOT NULL,
  fee             NUMERIC(10, 2) NOT NULL,
  gift_count      INT NOT NULL,
  mode            TEXT NOT NULL CHECK (mode IN ('scheduled', 'pull')),
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'reversed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at         TIMESTAMPTZ,
  failure_reason  TEXT
);
```
`status` is driven by `transfer.created` → `pending`, `transfer.paid` → `paid`, `transfer.failed/reversed` → respective.

---

## Anti-fraud rules to enforce

These are checks the wallet routes should make before crediting balances or sending transfers:

1. **Top-up confirm** — already enforces `paymentIntent.user_id === auth.user.id` and `paymentIntent.metadata.type === 'wallet_topup'`. ✅
2. **Top-up confirm** — must also enforce `paymentIntent.amount === walletAmount + fee` (compare against fresh server-side calc, not metadata) to prevent metadata tampering.
3. **Top-up confirm** — must enforce `paymentIntent.status === 'succeeded'` ✅ (already does)
4. **Transfer creation (cron + pull)** — sum `gifts.creator_amount WHERE settled_at IS NULL AND creator_id = X` server-side; don't trust client-supplied amounts.
5. **Transfer creation** — verify `creator.stripe_onboarding_complete === true` and account is in `account.updated`-confirmed good state before transferring.
6. **Webhook signature verification** ✅ (already done; logs admin issue on failure).
7. **Idempotent webhook processing** — currently the route processes events without recording them. Add `stripe_events` PK collision = skip handler.
8. **Idempotency keys on transfers** — pass `idempotencyKey: \`payout:${creator}:${batch_date}\`` on `stripe.transfers.create` so a retried cron run doesn't double-pay.

---

## Implementation status

### ✅ Shipped (PR `davis/creator-gift-payouts`)
1. ~~Schema migrations~~ — landed in single migration `00030_payment_audit_and_settlement.sql` (stripe_events, wallet_transactions provenance + backfill, gifts settlement columns, creator_payouts)
2. ~~`stripe_events` write at top of webhook handler~~ + idempotency check via PK collision
3. ~~Backfill `wallet_transactions.stripe_payment_intent_id` from `description`~~ — done in same migration before enforcing the unique index
4. ~~New webhook cases~~ — `charge.succeeded`, `transfer.reversed`, `payout.paid`, `radar.early_fraud_warning.created`
5. ~~Settlement cron~~ — `/api/cron/payout-creator-gifts` + `.github/workflows/payout-creator-gifts.yml`
6. ~~Pull endpoint~~ — `POST /api/payouts/withdraw` with rate limit + min threshold
7. ~~Studio UI~~ — `GiftsReceivedSection` + `WithdrawButton` on `/studio`
8. ~~Top-up confirm hardening~~ — `paymentIntent.amount` sanity check against fresh server-side calc
9. ~~Email notification scaffolding~~ — `lib/notifications/payoutEmail.ts` stub wired into both payout paths (currently logs only — no provider configured yet)

### ⏳ Pending (needs Rye / external setup)

| TODO | Owner | Blocker |
|---|---|---|
| Apply migration `00030` to live DB | Davis | Just needs a free moment |
| Configure Stripe webhook endpoint to send the new events (`charge.succeeded`, `transfer.reversed`, `payout.paid`, `radar.early_fraud_warning.created`) | Davis | Needs Rye to share Stripe Dashboard access |
| **Set platform payout schedule to Manual** | Rye | Required before the fee-sweep cron can be safely run |
| **Build platform fee-sweep cron** (option 3 above) — `POST /api/cron/sweep-platform-fees`, `platform_fee_sweeps` table, weekly GH Actions workflow, admin "Recent fee sweeps" panel | Davis | Blocked on Rye flipping platform payout schedule to Manual; build queued for post-merge of current PR |
| Confirm Stripe Connect Express monthly active fee | Rye | Verify current Stripe pricing page; just informational at this point since payouts are free for creators either way |
| Set up transactional email provider (Resend recommended) | Davis | Tracked in `docs/external-services-todo.md`; replaces the `payoutEmail.ts` stub |
| Manually trigger the payout workflow once on a test creator before letting the cron run unattended | Davis | After migration applied + webhook events configured |
| Tests — top-up amount tampering, double-credit retry, transfer reversal, partial settlement | Davis | Lower priority; manual smoke covers the critical paths for now |

---

## Open questions for Rye

- [x] ~~Sign off on fee structure: $2 flat scheduled / 5% pull / $10 min threshold~~ — **Updated**: scheduled fee changed to **2.9% + $0.30** to mirror Stripe's inbound card processing fee (recoups the cost JungleGym ate at top-up time). Pull stays at 5%, min stays at $10, rate limit stays at 7 days.
- [x] ~~Pull rate limit — 1 per 7d?~~ — confirmed 7d.
- [x] ~~What happens if a creator has unsettled gifts but isn't Stripe-onboarded?~~ — **non-issue**: live streaming is gated on Connect onboarding, so creators can't receive gifts before they can be paid out. No queueing logic needed.
- [x] ~~Notify creators on payout — email? Realtime toast?~~ — **email** chosen; scaffolded but not yet sending until provider is configured.
- [ ] **Confirm Stripe Connect Express monthly active fee** (verify on current pricing page)
- [ ] Where does the carved fee land — JungleGym platform balance or a dedicated `platform_fees` ledger? (Currently it just stays in the platform balance as the difference between gross and amount_paid; explicit ledger is overkill until accounting needs it)
- [ ] **Approve switching platform payout schedule to Manual** (see "Where the money lives" — biggest cash-flow architecture decision)
