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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata ?? {}

    if (meta.type === 'video_purchase') {
      await supabase.from('purchases').insert({
        user_id: meta.user_id,
        video_id: meta.video_id,
        tier: meta.tier,
        amount_paid: Number(meta.video_price),
        platform_tip_pct: Number(meta.tip_pct),
        platform_amount: Number(meta.platform_amount),
        total_amount: Number(meta.total_amount),
        stripe_payment_intent_id: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
      })
    }

    if (meta.type === 'membership') {
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription?.id ?? null)

      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        await supabase.from('memberships').upsert({
          user_id: meta.user_id,
          stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
          stripe_subscription_id: subscriptionId,
          status: sub.status,
          current_period_end: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' })
      }
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await supabase
      .from('memberships')
      .update({
        status: sub.status,
        current_period_end: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', sub.id)
  }

  return NextResponse.json({ received: true })
}
