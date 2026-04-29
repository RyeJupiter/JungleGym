import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { recordAdminIssue } from '@/lib/adminIssues'
import { sendPayoutNotification } from '@/lib/notifications/payoutEmail'
import {
  calculatePullPayout,
  PAYOUT_MIN_AMOUNT,
  PAYOUT_PULL_RATE_LIMIT_DAYS,
} from '@junglegym/shared'

// POST /api/payouts/withdraw
//
// Creator-initiated pull of unsettled gift balance to their connected
// Stripe account. Faster than waiting for the monthly cron, but carries a
// higher percentage fee. Rate limited to one pull per N days per creator.

type GiftRow = {
  id: string
  creator_amount: number | string
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const svc = createServiceSupabaseClient()

  // Rate limit — block if there's a pull payout newer than the cooldown window.
  const cooldownMs = PAYOUT_PULL_RATE_LIMIT_DAYS * 24 * 60 * 60 * 1000
  const cooldownCutoff = new Date(Date.now() - cooldownMs).toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentPull } = await (svc as any)
    .from('creator_payouts')
    .select('id, created_at')
    .eq('creator_id', user.id)
    .eq('mode', 'pull')
    .gt('created_at', cooldownCutoff)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentPull) {
    const nextEligible = new Date(new Date(recentPull.created_at).getTime() + cooldownMs)
    return NextResponse.json(
      {
        error: 'rate_limited',
        message: `You can pull again on ${nextEligible.toISOString()}.`,
        nextEligibleAt: nextEligible.toISOString(),
      },
      { status: 429 }
    )
  }

  // Verify Stripe Connect onboarding state + grab email/display_name for
  // the post-payout notification.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (svc as any)
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete, display_name')
    .eq('user_id', user.id)
    .maybeSingle()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (svc as any)
    .from('users')
    .select('email')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.stripe_account_id || !profile?.stripe_onboarding_complete) {
    return NextResponse.json(
      { error: 'not_connected', message: 'Connect your Stripe account in Settings before withdrawing.' },
      { status: 400 }
    )
  }

  // Sum unsettled gifts and capture their ids in one pass.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error: queryErr } = await (svc as any)
    .from('gifts')
    .select('id, creator_amount')
    .eq('creator_id', user.id)
    .is('settled_at', null)

  if (queryErr) {
    return NextResponse.json({ error: `query failed: ${queryErr.message}` }, { status: 500 })
  }

  const gifts = (rows ?? []) as GiftRow[]
  const gross = gifts.reduce((sum, g) => {
    const amount = typeof g.creator_amount === 'string' ? Number(g.creator_amount) : g.creator_amount
    return Math.round((sum + amount) * 100) / 100
  }, 0)

  if (gross < PAYOUT_MIN_AMOUNT) {
    return NextResponse.json(
      {
        error: 'below_minimum',
        message: `Minimum withdrawal is $${PAYOUT_MIN_AMOUNT}. You have $${gross.toFixed(2)} unsettled.`,
        balance: gross,
      },
      { status: 400 }
    )
  }

  const { fee, amountPaid } = calculatePullPayout(gross)
  const amountCents = Math.round(amountPaid * 100)

  const stripe = getStripe()

  let transferId: string
  try {
    // Idempotency: include a millisecond timestamp so each pull request is
    // a fresh idempotency window. The 7-day rate limit above prevents abuse.
    const idempotencyKey = `payout:pull:${user.id}:${Date.now()}`
    const transfer = await stripe.transfers.create(
      {
        amount: amountCents,
        currency: 'usd',
        destination: profile.stripe_account_id,
        description: 'JungleGym gift payout — manual withdrawal',
        metadata: {
          type: 'gift_payout_pull',
          creator_id: user.id,
          gift_count: String(gifts.length),
          fee: String(fee),
          gross: String(gross),
        },
      },
      { idempotencyKey }
    )
    transferId = transfer.id
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await recordAdminIssue({
      kind: 'payout_transfer_failed',
      severity: 'error',
      title: 'Pull-payout Stripe Transfer failed',
      description: `Creator ${user.id} pull-withdraw failed for $${amountPaid.toFixed(2)} (gross $${gross.toFixed(2)}): ${msg}`,
      context: { creatorId: user.id, gross, amountPaid, fee, error: msg },
    })
    return NextResponse.json({ error: 'transfer_failed', message: msg }, { status: 502 })
  }

  // Record creator_payouts row first (small blast radius if it fails — the
  // Stripe transfer already happened, but the Stripe idempotency key on
  // re-attempt would not match because of Date.now(); next pull would be
  // gated by rate limit anyway).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: payoutErr } = await (svc as any)
    .from('creator_payouts')
    .insert({
      creator_id: user.id,
      transfer_id: transferId,
      amount_paid: amountPaid,
      fee,
      gross_amount: gross,
      gift_count: gifts.length,
      mode: 'pull',
      status: 'paid',
      paid_at: new Date().toISOString(),
    })

  if (payoutErr) {
    await recordAdminIssue({
      kind: 'payout_record_insert_failed',
      severity: 'error',
      title: 'Pull-payout Transfer succeeded but creator_payouts insert failed',
      description: `Transfer ${transferId} ($${amountPaid.toFixed(2)}) to ${user.id} succeeded but DB insert failed: ${payoutErr.message}. Manual fix required: insert the row + mark gifts settled.`,
      context: { creatorId: user.id, transferId, amountPaid, fee, gross, dbError: payoutErr.message },
    })
    return NextResponse.json(
      { error: 'partial', message: 'Payout sent but record failed. Admin notified.' },
      { status: 500 }
    )
  }

  const giftIds = gifts.map((g) => g.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: settleErr } = await (svc as any)
    .from('gifts')
    .update({
      settled_at: new Date().toISOString(),
      transfer_id: transferId,
      settlement_mode: 'pull',
    })
    .in('id', giftIds)

  if (settleErr) {
    await recordAdminIssue({
      kind: 'payout_gift_settle_failed',
      severity: 'error',
      title: 'Pull-payout: gifts.settled_at update failed',
      description: `Transfer ${transferId} paid + creator_payouts row written, but ${giftIds.length} gifts still show unsettled. Manual SQL fix required.`,
      context: { creatorId: user.id, transferId, giftIds, dbError: settleErr.message },
    })
  }

  // Per-gift fee breakdown (best-effort, like the cron)
  for (const gift of gifts) {
    const giftAmount = typeof gift.creator_amount === 'string' ? Number(gift.creator_amount) : gift.creator_amount
    const giftFee = Math.round((fee * (giftAmount / gross)) * 100) / 100
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (svc as any)
      .from('gifts')
      .update({ settlement_fee: giftFee })
      .eq('id', gift.id)
  }

  // Best-effort notification — must not block the response.
  if (userRow?.email) {
    await sendPayoutNotification({
      creatorEmail: userRow.email,
      creatorName: profile?.display_name ?? 'creator',
      amountPaid,
      fee,
      grossAmount: gross,
      giftCount: gifts.length,
      mode: 'pull',
      transferId,
    }).catch((err) => {
      console.error('[payouts/withdraw] notification failed', err)
    })
  }

  return NextResponse.json({
    success: true,
    transferId,
    amountPaid,
    fee,
    gross,
    giftCount: gifts.length,
  })
}
