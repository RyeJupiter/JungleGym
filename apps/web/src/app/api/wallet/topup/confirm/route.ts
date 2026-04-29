import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { recordAdminIssue } from '@/lib/adminIssues'
import { calculateTopUpTotal } from '@junglegym/shared'

/**
 * POST /api/wallet/topup/confirm
 *
 * Called after Stripe payment succeeds client-side.
 * Verifies the PaymentIntent, then credits the user's wallet.
 * Idempotent — unique index uq_wallet_tx_pi on stripe_payment_intent_id prevents double-credit.
 */
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

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

  if (paymentIntent.status !== 'succeeded') {
    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
  }

  const meta = paymentIntent.metadata
  if (meta.type !== 'wallet_topup') {
    return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
  }

  if (meta.user_id !== user.id) {
    return NextResponse.json({ error: 'Payment does not belong to this user' }, { status: 403 })
  }

  const walletAmount = Number(meta.wallet_amount)
  if (!walletAmount || walletAmount <= 0) {
    return NextResponse.json({ error: 'Invalid wallet amount' }, { status: 400 })
  }

  // Defense in depth: verify the PaymentIntent's actual amount matches what
  // we'd charge for this wallet_amount today. Catches code-side bugs where
  // metadata drifted from the intent's amount, and any future tampering of
  // the create-side route (where amount is set from the request body).
  const expected = calculateTopUpTotal(walletAmount)
  const expectedCents = Math.round(expected.chargeTotal * 100)
  if (paymentIntent.amount !== expectedCents) {
    await recordAdminIssue({
      kind: 'wallet_topup_amount_mismatch',
      severity: 'error',
      title: 'Wallet top-up — PI amount does not match server-side calc',
      description: `PaymentIntent ${paymentIntentId} has amount ${paymentIntent.amount}¢ but wallet_amount=$${walletAmount.toFixed(2)} should charge ${expectedCents}¢. Refusing to credit.`,
      context: {
        paymentIntentId,
        userId: user.id,
        walletAmount,
        piAmountCents: paymentIntent.amount,
        expectedCents,
      },
    })
    return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 })
  }

  const svc = createServiceSupabaseClient()

  // Upsert wallet (create if first top-up)
  await svc
    .from('wallets')
    .upsert(
      { user_id: user.id, balance: 0 },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )

  // Get current balance
  const { data: currentWallet } = await svc
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  const currentBalance = currentWallet?.balance ?? 0
  const newBalance = Math.round((currentBalance + walletAmount) * 100) / 100

  // Insert transaction FIRST — uq_wallet_tx_pi (unique on stripe_payment_intent_id)
  // prevents double-credit. If the webhook already credited this PI, the insert
  // fails and we skip the balance update.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: txError } = await (svc as any).from('wallet_transactions').insert({
    user_id: user.id,
    type: 'topup' as const,
    amount: walletAmount,
    balance_after: newBalance,
    description: `topup:${paymentIntentId}`,
    stripe_payment_intent_id: paymentIntentId,
  })

  if (txError) {
    // Duplicate key = already credited (by webhook or prior confirm call)
    if (txError.code === '23505' || txError.message?.includes('duplicate')) {
      const { data: wallet } = await svc
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single()
      return NextResponse.json({ success: true, balance: wallet?.balance ?? 0 })
    }
    console.error('[wallet/topup/confirm] tx insert failed:', txError)
    await recordAdminIssue({
      kind: 'wallet_topup_insert_failed',
      severity: 'error',
      title: 'Wallet top-up — failed to record transaction',
      description: `PaymentIntent ${paymentIntentId} succeeded ($${walletAmount.toFixed(2)}) but wallet_transactions insert failed: ${txError.message}`,
      context: {
        paymentIntentId,
        userId: user.id,
        walletAmount,
        dbError: txError.message,
        dbErrorCode: txError.code,
      },
    })
    return NextResponse.json({ error: 'Failed to credit wallet' }, { status: 500 })
  }

  // Transaction inserted successfully — now update balance
  await svc
    .from('wallets')
    .update({ balance: newBalance })
    .eq('user_id', user.id)

  return NextResponse.json({ success: true, balance: newBalance })
}
