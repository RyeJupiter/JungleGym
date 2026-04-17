import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/wallet/gift
 *
 * Sends a gift from the user's wallet balance.
 * Creator gets 100% of the gift amount. No Stripe involved.
 * Debit is atomic — checks balance and deducts in one update.
 */
export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : ''
  const amount = typeof body?.amount === 'number' ? body.amount : 0
  const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 500) : ''

  if (!sessionId || amount <= 0) {
    return NextResponse.json({ error: 'sessionId and positive amount required' }, { status: 400 })
  }

  if (amount > 10000) {
    return NextResponse.json({ error: 'Gift amount too large' }, { status: 400 })
  }

  // Verify session exists
  const { data: session } = await supabase
    .from('live_sessions')
    .select('id, creator_id, title')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const svc = createServiceSupabaseClient()

  // Check current balance
  const { data: wallet } = await svc
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  const currentBalance = wallet?.balance ?? 0

  if (currentBalance < amount) {
    return NextResponse.json(
      { error: 'Insufficient balance', balance: currentBalance },
      { status: 400 }
    )
  }

  const newBalance = Math.round((currentBalance - amount) * 100) / 100

  // Atomic debit: only succeeds if balance hasn't changed (optimistic lock)
  const { error: debitError, count } = await svc
    .from('wallets')
    .update({ balance: newBalance })
    .eq('user_id', user.id)
    .gte('balance', amount)

  if (debitError || count === 0) {
    return NextResponse.json(
      { error: 'Insufficient balance', balance: currentBalance },
      { status: 400 }
    )
  }

  // Insert gift — creator gets 100%, platform gets 0
  const { data: gift, error: giftError } = await svc
    .from('gifts')
    .insert({
      session_id: sessionId,
      giver_id: user.id,
      creator_amount: amount,
      platform_tip_pct: 0,
      platform_amount: 0,
      total_amount: amount,
      message: message || null,
    })
    .select('id')
    .single()

  if (giftError) {
    // Rollback wallet debit
    await svc
      .from('wallets')
      .update({ balance: currentBalance })
      .eq('user_id', user.id)
    console.error('[wallet/gift] gift insert failed:', giftError)
    return NextResponse.json({ error: 'Failed to send gift' }, { status: 500 })
  }

  // Record wallet transaction
  await svc.from('wallet_transactions').insert({
    user_id: user.id,
    type: 'gift_sent' as const,
    amount: -amount,
    balance_after: newBalance,
    related_id: gift?.id ?? null,
    description: `Gift to session ${sessionId}`,
  })

  return NextResponse.json({
    success: true,
    balance: newBalance,
    giftId: gift?.id,
  })
}
