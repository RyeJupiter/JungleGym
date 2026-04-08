import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const stripe = getStripe()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { paymentIntentId } = body ?? {}

  if (!paymentIntentId) {
    return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 })
  }

  // Retrieve the PaymentIntent from Stripe to verify it actually succeeded
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

  if (paymentIntent.status !== 'succeeded') {
    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
  }

  const meta = paymentIntent.metadata
  if (meta.type !== 'video_purchase') {
    return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
  }

  // Verify the payment belongs to this user
  if (meta.user_id !== user.id) {
    return NextResponse.json({ error: 'Payment does not belong to this user' }, { status: 403 })
  }

  // Use service role to bypass RLS for insert
  const svc = await createServiceSupabaseClient()

  // Idempotent insert — unique(user_id, video_id) constraint prevents duplicates
  const { error: insertError } = await svc.from('purchases').insert({
    user_id: meta.user_id,
    video_id: meta.video_id,
    tier: meta.tier,
    amount_paid: Number(meta.video_price),
    platform_tip_pct: Number(meta.tip_pct),
    platform_amount: Number(meta.platform_amount),
    total_amount: Number(meta.total_amount),
    stripe_payment_intent_id: paymentIntent.id,
  })

  // Duplicate key error is fine — means webhook already handled it
  if (insertError && !insertError.message.includes('duplicate')) {
    return NextResponse.json({ error: 'Failed to record purchase' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
