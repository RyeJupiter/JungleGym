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

## Stripe fees (verify against [stripe.com/pricing](https://stripe.com/pricing) before committing to numbers)

| Item | Fee | Who pays |
|---|---|---|
| Domestic card charge | 2.9% + $0.30 | JungleGym (deducted from gross before settlement) |
| International card surcharge | +1.5% | JungleGym |
| Currency conversion | +1% | JungleGym |
| Disputes / chargebacks | $15 | JungleGym (refunded if dispute won) |
| Stripe Connect Express — monthly active account | $2/mo per connected account that received a payout that month | JungleGym |
| Standard ACH payout (connected account → bank) | Free | Connected account |
| Instant payout (connected account → debit card) | 1.5% (min $0.50) | Connected account |
| Platform → connected account Transfer | Free | — |

**What this means for our flows:**
- A $25 wallet top-up costs us `$25 × 2.9% + $0.30 = $1.025` at minimum. Our 7% top-up fee = $1.75 → leaves ~$0.72 margin per top-up to cover gift settlement costs and Connect monthly fees.
- Transfers from platform → connected account are **free** at Stripe layer, so the only friction in batched gift payouts is the Connect monthly active fee ($2/mo per creator who gets paid that month).

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

#### Option B — scheduled monthly payout (default)
- Cron runs the 1st of each month at, say, 04:00 UTC.
- For each creator with `unsettled_gift_balance > min_payout_threshold`:
  - Sum their unsettled `gifts.creator_amount` rows
  - Subtract a small **scheduled-payout fee** (target: just cover the $2 Connect monthly active fee — e.g. flat $2 deducted, or 2% capped)
  - Create one `stripe.transfers.create({ amount, destination })` per creator
  - Mark every gift in the batch with `settled_at = now()` + `transfer_id = tr_…`
- Threshold prevents tiny payouts where the $2 active fee dominates. Suggest **$10 minimum** — anything below rolls to next month.

#### Option C — on-demand pull (creator-initiated)
- Studio "Withdraw $X" button. Creator can request anytime their unsettled balance ≥ minimum.
- Carve a **larger pull fee** to discourage frequent small withdrawals — e.g. 5% (still well below Stripe's 1.5% instant-payout fee on the creator side, but enough to nudge people toward the free monthly).
- Same flow: bundle unsettled gifts → create Transfer → mark settled with transfer_id.
- Hard rate limit: 1 pull per 7 days per creator (TBD — protects against accidental double-clicks turning into fee waste).

#### Fee numbers — to be decided with Rye
| Mode | Fee | Rationale |
|---|---|---|
| Scheduled monthly | flat **$2** (or 2% capped at $5) | Covers Connect monthly active fee, near zero JungleGym margin |
| On-demand pull | **5%** of payout | Covers Connect fee + nudges creators toward the free monthly cadence |
| Min payout threshold | **$10** | Prevents tiny payouts where fee % dominates |

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

## Implementation order

1. **Schema migrations** (`00030_stripe_audit.sql`, `00031_gift_settlement.sql`, `00032_creator_payouts.sql`)
2. **`stripe_events` write at top of webhook handler** + idempotency check
3. **Backfill `wallet_transactions.stripe_payment_intent_id` from `description`** then add the unique index
4. **New webhook cases**: `charge.succeeded`, `transfer.*`, `payout.paid`, `radar.early_fraud_warning.created`
5. **Settlement cron** — `/api/cron/payout-creator-gifts` triggered by GH Actions monthly, protected by `CRON_SECRET`
6. **Pull endpoint** — `POST /api/payouts/withdraw` (auth: creator self-service)
7. **Studio UI** — withdraw button + scheduled-payout history table
8. **Tests** — top-up amount tampering, double-credit retry, transfer reversal, partial settlement

---

## Open questions for Rye

- [ ] Confirm Stripe fee table (esp. Connect Express monthly active fee — verify on current pricing page)
- [ ] Sign off on fee structure: $2 flat scheduled / 5% pull / $10 min threshold
- [ ] Where does the carved fee land — JungleGym platform balance or a dedicated `platform_fees` ledger?
- [ ] Pull rate limit — 1 per 7d? 1 per 30d? unlimited but min-balance enforced?
- [ ] What happens if a creator has unsettled gifts but isn't Stripe-onboarded? Block gifts, queue indefinitely, or auto-prompt them on receive?
- [ ] Notify creators on payout — email? Realtime toast? Both?
