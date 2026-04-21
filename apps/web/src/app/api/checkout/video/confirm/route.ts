import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { recordAdminIssue } from '@/lib/adminIssues'

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

  // Upsert — overwrites an expired share-redemption row with the paid purchase,
  // idempotent against the webhook writing the same data first.
  // expires_at is explicitly null so the row becomes permanent.
  const upsertPayload = {
    user_id: meta.user_id,
    video_id: meta.video_id,
    tier: meta.tier,
    amount_paid: Number(meta.video_price),
    platform_tip_pct: Number(meta.fee_pct),
    platform_amount: Number(meta.platform_amount),
    total_amount: Number(meta.total_amount),
    stripe_payment_intent_id: paymentIntent.id,
    expires_at: null,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: upsertError } = await (svc as any)
    .from('purchases')
    .upsert(upsertPayload, { onConflict: 'user_id,video_id' })

  if (upsertError) {
    console.error('[checkout/video/confirm] upsert failed:', upsertError)
    // Highest-severity silent failure: Stripe took the buyer's money but
    // we couldn't record the purchase. An admin needs to reconcile this
    // manually — grant the video (or refund) + insert the row by hand.
    await recordAdminIssue({
      kind: 'purchase_insert_failed',
      severity: 'error',
      title: 'Paid video purchase — failed to record purchase row',
      description: `PaymentIntent ${paymentIntent.id} succeeded ($${(paymentIntent.amount / 100).toFixed(2)}) but the purchases row insert failed: ${upsertError.message}`,
      context: {
        paymentIntentId: paymentIntent.id,
        userId: meta.user_id,
        videoId: meta.video_id,
        tier: meta.tier,
        amount: paymentIntent.amount / 100,
        dbError: upsertError.message,
      },
    })
    return NextResponse.json(
      { error: 'Failed to record purchase' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
