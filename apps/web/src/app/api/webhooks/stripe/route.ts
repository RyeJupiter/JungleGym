import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { recordAdminIssue } from '@/lib/adminIssues'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: 'Missing webhook secret or signature' }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook signature verification failed'
    // Repeated signature failures usually mean the webhook secret drifted
    // or an attacker is probing — either way an admin wants to see it.
    await recordAdminIssue({
      kind: 'stripe_webhook_signature',
      severity: 'error',
      title: 'Stripe webhook signature verification failed',
      description: msg,
    })
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const supabase = createServiceSupabaseClient()

  // ── helpers ─────────────────────────────────────────────────────────────────

  function subPeriodEnd(sub: Stripe.Subscription): string {
    return new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString()
  }

  async function syncSubscription(sub: Stripe.Subscription) {
    await supabase
      .from('memberships')
      .update({ status: sub.status, current_period_end: subPeriodEnd(sub) })
      .eq('stripe_subscription_id', sub.id)
  }

  // ── event routing ────────────────────────────────────────────────────────────

  try {
  switch (event.type) {

    // ── One-time checkout completed (video purchase OR initial membership) ────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const meta = session.metadata ?? {}

      if (meta.type === 'video_purchase') {
        // Upsert — overwrites expired share rows and is idempotent with the confirm route
        await supabase.from('purchases').upsert({
          user_id: meta.user_id,
          video_id: meta.video_id,
          tier: meta.tier,
          amount_paid: Number(meta.video_price),
          platform_tip_pct: Number(meta.fee_pct || meta.tip_pct),
          platform_amount: Number(meta.platform_amount),
          total_amount: Number(meta.total_amount),
          stripe_payment_intent_id:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
          expires_at: null,
        }, { onConflict: 'user_id,video_id' })
      }

      if (meta.type === 'membership') {
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : (session.subscription?.id ?? null)

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          await supabase.from('memberships').upsert(
            {
              user_id: meta.user_id,
              stripe_customer_id:
                typeof session.customer === 'string' ? session.customer : null,
              stripe_subscription_id: subscriptionId,
              status: sub.status,
              current_period_end: subPeriodEnd(sub),
            },
            { onConflict: 'stripe_subscription_id' }
          )
        }
      }
      break
    }

    // ── Subscription lifecycle ───────────────────────────────────────────────
    case 'customer.subscription.created': {
      // Safety net for checkout.session.completed. We only write if we can
      // confidently resolve the owning user — either via metadata set on the
      // subscription, or by matching an existing membership row on
      // stripe_customer_id (written by the checkout.session.completed handler).
      const sub = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : null
      let userId = (sub.metadata?.user_id as string | undefined) ?? null

      if (!userId && customerId) {
        const { data: existing } = await supabase
          .from('memberships')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()
        userId = (existing?.user_id as string | undefined) ?? null
      }

      if (userId) {
        await supabase.from('memberships').upsert(
          {
            stripe_subscription_id: sub.id,
            stripe_customer_id: customerId,
            status: sub.status,
            current_period_end: subPeriodEnd(sub),
            user_id: userId,
          },
          { onConflict: 'stripe_subscription_id' }
        )
      } else {
        console.warn('[stripe webhook] subscription.created without resolvable user_id', sub.id)
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await syncSubscription(event.data.object as Stripe.Subscription)
      break
    }

    // ── Invoice events (monthly renewals) ────────────────────────────────────
    case 'invoice.paid':
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : (invoice.subscription as Stripe.Subscription | null)?.id ?? null
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId)
        await syncSubscription(sub)
      }
      break
    }

    case 'invoice.payment_failed': {
      // Mark membership as past_due so UI can prompt user to update payment method
      const invoice = event.data.object as Stripe.Invoice
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : (invoice.subscription as Stripe.Subscription | null)?.id ?? null
      if (subId) {
        await supabase
          .from('memberships')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subId)
      }
      break
    }

    // ── Payment intent succeeded (inline Elements checkout) ────────────────
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const meta = pi.metadata ?? {}

      if (meta.type === 'video_purchase') {
        // Upsert — overwrites expired share rows and is idempotent with the confirm route
        await supabase.from('purchases').upsert({
          user_id: meta.user_id,
          video_id: meta.video_id,
          tier: meta.tier,
          amount_paid: Number(meta.video_price),
          platform_tip_pct: Number(meta.fee_pct || meta.tip_pct),
          platform_amount: Number(meta.platform_amount),
          total_amount: Number(meta.total_amount),
          stripe_payment_intent_id: pi.id,
          expires_at: null,
        }, { onConflict: 'user_id,video_id' })
      }

      if (meta.type === 'wallet_topup') {
        // Safety net — confirm route usually handles this first.
        // Unique index on description prevents double-credit even under race conditions.
        const walletAmount = Number(meta.wallet_amount)
        if (walletAmount > 0 && meta.user_id) {
          await supabase
            .from('wallets')
            .upsert(
              { user_id: meta.user_id, balance: 0 },
              { onConflict: 'user_id', ignoreDuplicates: true }
            )

          const { data: wallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', meta.user_id)
            .single()

          const currentBalance = wallet?.balance ?? 0
          const newBalance = Math.round((currentBalance + walletAmount) * 100) / 100

          // Insert transaction first — unique index catches duplicates
          const { error: txError } = await supabase.from('wallet_transactions').insert({
            user_id: meta.user_id,
            type: 'topup',
            amount: walletAmount,
            balance_after: newBalance,
            description: `topup:${pi.id}`,
          })

          // Only update balance if the insert succeeded (not a duplicate)
          if (!txError) {
            await supabase
              .from('wallets')
              .update({ balance: newBalance })
              .eq('user_id', meta.user_id)
          }
        }
      }
      break
    }

    // ── Payment intent failures (one-time video purchases) ───────────────────
    case 'payment_intent.payment_failed': {
      // Nothing to undo — we only write to purchases on success.
      // Log-worthy but no DB action needed.
      break
    }

    // ── Disputes / chargebacks ───────────────────────────────────────────────
    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute
      // Flag the purchase row so the team can review
      const piId = typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : (dispute.payment_intent as Stripe.PaymentIntent | null)?.id ?? null
      if (piId) {
        await supabase
          .from('purchases')
          .update({ stripe_payment_intent_id: `DISPUTED:${piId}` })
          .eq('stripe_payment_intent_id', piId)
      }
      // Chargebacks need a human — respond in Stripe within the deadline
      // or we lose the funds + pay a $15 fee.
      await recordAdminIssue({
        kind: 'stripe_dispute',
        severity: 'error',
        title: 'Stripe dispute opened',
        description: `Reason: ${dispute.reason}. Amount: $${(dispute.amount / 100).toFixed(2)}.`,
        context: {
          disputeId: dispute.id,
          paymentIntentId: piId,
          amount: dispute.amount / 100,
          currency: dispute.currency,
          reason: dispute.reason,
          status: dispute.status,
          dueBy: dispute.evidence_details?.due_by
            ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
            : null,
        },
      })
      break
    }

    // ── Refunds ──────────────────────────────────────────────────────────────
    case 'charge.refunded': {
      // For now just flag — access revocation is a manual decision
      const charge = event.data.object as Stripe.Charge
      const piId = typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : (charge.payment_intent as Stripe.PaymentIntent | null)?.id ?? null
      if (piId) {
        await supabase
          .from('purchases')
          .update({ stripe_payment_intent_id: `REFUNDED:${piId}` })
          .eq('stripe_payment_intent_id', piId)
      }
      // Info severity — refunds are usually intentional, but an admin
      // still needs to decide whether to revoke the buyer's access.
      await recordAdminIssue({
        kind: 'stripe_refund',
        severity: 'info',
        title: 'Stripe refund issued',
        description: `$${(charge.amount_refunded / 100).toFixed(2)} refunded. Review whether to revoke the buyer's access.`,
        context: {
          chargeId: charge.id,
          paymentIntentId: piId,
          amountRefunded: charge.amount_refunded / 100,
          currency: charge.currency,
        },
      })
      break
    }

    // ── Creator payout failures (Stripe Connect) ─────────────────────────────
    case 'payout.failed':
    case 'payout.canceled': {
      const payout = event.data.object as Stripe.Payout
      // event.account is the Connected Account ID when the event is
      // forwarded from a creator's connected account.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const connectedAccountId = (event as any).account as string | undefined
      await recordAdminIssue({
        kind: 'payout_failed',
        severity: 'error',
        title: `Creator payout ${payout.status}`,
        description: `$${(payout.amount / 100).toFixed(2)} payout ${payout.status}. Reason: ${payout.failure_message ?? payout.failure_code ?? 'unknown'}.`,
        context: {
          payoutId: payout.id,
          connectedAccountId,
          amount: payout.amount / 100,
          currency: payout.currency,
          status: payout.status,
          failureCode: payout.failure_code,
          failureMessage: payout.failure_message,
        },
      })
      break
    }

    // ── Stripe Connect: account onboarding status changes ──────────────
    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      if (account.charges_enabled && account.details_submitted) {
        // Mark creator's onboarding as complete
        await supabase
          .from('profiles')
          .update({ stripe_onboarding_complete: true })
          .eq('stripe_account_id', account.id)
      }
      break
    }

    default:
      // Unhandled event — return 200 so Stripe doesn't retry
      break
  }
  } catch (err) {
    // Any case threw while processing — record for admin attention and
    // return 500 so Stripe retries (we'd rather have a duplicate issue
    // than a permanently dropped event).
    const msg = err instanceof Error ? err.message : String(err)
    await recordAdminIssue({
      kind: 'webhook_handler_error',
      severity: 'error',
      title: `Stripe webhook handler failed (${event.type})`,
      description: msg.slice(0, 500),
      context: {
        eventId: event.id,
        eventType: event.type,
      },
    })
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
