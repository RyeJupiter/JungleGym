import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: 'Missing webhook secret or signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook signature verification failed'
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

  switch (event.type) {

    // ── One-time checkout completed (video purchase OR initial membership) ────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const meta = session.metadata ?? {}

      if (meta.type === 'video_purchase') {
        // Idempotent: ignore duplicate if payment_intent already recorded
        await supabase.from('purchases').insert({
          user_id: meta.user_id,
          video_id: meta.video_id,
          tier: meta.tier,
          amount_paid: Number(meta.video_price),
          platform_tip_pct: Number(meta.tip_pct),
          platform_amount: Number(meta.platform_amount),
          total_amount: Number(meta.total_amount),
          stripe_payment_intent_id:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
        })
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
      // Backup to checkout.session.completed — upsert in case it fires first
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('memberships').upsert(
        {
          stripe_subscription_id: sub.id,
          stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : null,
          status: sub.status,
          current_period_end: subPeriodEnd(sub),
          // user_id resolved via checkout.session metadata — this is a safety net only
          user_id: (sub.metadata?.user_id as string | undefined) ?? '',
        },
        { onConflict: 'stripe_subscription_id' }
      )
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
      break
    }

    default:
      // Unhandled event — return 200 so Stripe doesn't retry
      break
  }

  return NextResponse.json({ received: true })
}
