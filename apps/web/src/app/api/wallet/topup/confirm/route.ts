import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

/**
 * POST /api/wallet/topup/confirm
 *
 * Called after Stripe payment succeeds client-side.
 * Verifies the PaymentIntent, then credits the user's wallet.
 * Idempotent — checks wallet_transactions to prevent double-credit.
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

  const svc = createServiceSupabaseClient()

  // Idempotency: check if this PI was already credited
  const { data: existingTx } = await svc
    .from('wallet_transactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'topup')
    .eq('description', `topup:${paymentIntentId}`)
    .maybeSingle()

  if (existingTx) {
    // Already credited — return current balance
    const { data: wallet } = await svc
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()
    return NextResponse.json({ success: true, balance: wallet?.balance ?? 0 })
  }

  // Upsert wallet (create if first top-up)
  const { data: wallet } = await svc
    .from('wallets')
    .upsert(
      { user_id: user.id, balance: 0 },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )
    .select('balance')
    .single()

  // Fetch current balance (upsert with ignoreDuplicates doesn't return updated row)
  const { data: currentWallet } = await svc
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  const currentBalance = currentWallet?.balance ?? 0
  const newBalance = Math.round((currentBalance + walletAmount) * 100) / 100

  // Update balance
  const { error: updateError } = await svc
    .from('wallets')
    .update({ balance: newBalance })
    .eq('user_id', user.id)

  if (updateError) {
    console.error('[wallet/topup/confirm] balance update failed:', updateError)
    return NextResponse.json({ error: 'Failed to credit wallet' }, { status: 500 })
  }

  // Record transaction
  await svc.from('wallet_transactions').insert({
    user_id: user.id,
    type: 'topup' as const,
    amount: walletAmount,
    balance_after: newBalance,
    description: `topup:${paymentIntentId}`,
  })

  return NextResponse.json({ success: true, balance: newBalance })
}
