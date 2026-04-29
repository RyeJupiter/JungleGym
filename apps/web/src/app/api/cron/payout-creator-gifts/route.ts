import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { recordAdminIssue } from '@/lib/adminIssues'
import { sendPayoutNotification } from '@/lib/notifications/payoutEmail'
import { calculateScheduledPayout, PAYOUT_MIN_AMOUNT } from '@junglegym/shared'

// Monthly cron — pays out unsettled gift balances to connected creators via
// Stripe Transfer. Triggered by GitHub Actions on the 1st of each month.
// Protected by CRON_SECRET (Bearer token), same pattern as purge-deleted-videos.
//
// Per creator with sum(unsettled gifts) >= PAYOUT_MIN_AMOUNT:
//   1. Sum unsettled gift rows (and capture their ids).
//   2. Carve flat scheduled fee.
//   3. stripe.transfers.create with idempotency key per (creator, month).
//   4. Insert creator_payouts row, mark all bundled gifts settled.
//
// transfer.reversed webhook unwinds settlement if a transfer is clawed back.

type GiftRow = {
  id: string
  creator_id: string
  creator_amount: number | string
}

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  const auth = request.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = getStripe()
  const svc = createServiceSupabaseClient()

  // batchKey is the YYYY-MM of the run. Used as part of the Stripe idempotency
  // key so re-runs in the same month don't double-pay, but a manual rerun
  // next month gets a fresh idempotency window.
  const now = new Date()
  const batchKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  // 1. Pull every unsettled gift row up front. We slice by creator client-side
  //    so we don't have to GROUP BY in SQL (Supabase JS client doesn't speak it
  //    natively) and so we have the gift ids on hand for the settlement update.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error: queryErr } = await (svc as any)
    .from('gifts')
    .select('id, creator_id, creator_amount')
    .is('settled_at', null)

  if (queryErr) {
    return NextResponse.json({ error: `query failed: ${queryErr.message}` }, { status: 500 })
  }

  const unsettled = (rows ?? []) as GiftRow[]
  const byCreator = new Map<string, { gifts: GiftRow[]; gross: number }>()
  for (const row of unsettled) {
    const amount = typeof row.creator_amount === 'string' ? Number(row.creator_amount) : row.creator_amount
    const bucket = byCreator.get(row.creator_id) ?? { gifts: [], gross: 0 }
    bucket.gifts.push(row)
    bucket.gross = Math.round((bucket.gross + amount) * 100) / 100
    byCreator.set(row.creator_id, bucket)
  }

  const results: Array<{
    creatorId: string
    ok: boolean
    skipped?: 'below_minimum' | 'not_connected'
    transferId?: string
    amountPaid?: number
    fee?: number
    giftCount?: number
    error?: string
  }> = []

  // 2. Process each creator sequentially. Stripe transfers shouldn't be
  //    parallelized — we're talking O(creators), and a steady stream is
  //    safer for retry/idempotency reasoning.
  for (const [creatorId, { gifts, gross }] of byCreator) {
    if (gross < PAYOUT_MIN_AMOUNT) {
      results.push({ creatorId, ok: true, skipped: 'below_minimum' })
      continue
    }

    // Look up the creator's connected account + display info for the email.
    // Live streaming is gated on onboarding complete, so this should always
    // be true when there are unsettled gifts — but guard defensively.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (svc as any)
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete, display_name')
      .eq('user_id', creatorId)
      .maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRow } = await (svc as any)
      .from('users')
      .select('email')
      .eq('id', creatorId)
      .maybeSingle()

    if (!profile?.stripe_account_id || !profile?.stripe_onboarding_complete) {
      // Should never happen — but if it does, an admin needs to know so the
      // gifts don't sit unsettled forever.
      await recordAdminIssue({
        kind: 'payout_creator_not_connected',
        severity: 'error',
        title: 'Unsettled gifts for non-onboarded creator',
        description: `Creator ${creatorId} has $${gross.toFixed(2)} in unsettled gifts but no connected Stripe account. Live streaming should have prevented this — investigate.`,
        context: { creatorId, gross, giftCount: gifts.length },
      })
      results.push({ creatorId, ok: false, skipped: 'not_connected' })
      continue
    }

    const { fee, amountPaid } = calculateScheduledPayout(gross)
    const amountCents = Math.round(amountPaid * 100)

    try {
      const transfer = await stripe.transfers.create(
        {
          amount: amountCents,
          currency: 'usd',
          destination: profile.stripe_account_id,
          description: `JungleGym gift payout — ${batchKey}`,
          metadata: {
            type: 'gift_payout_scheduled',
            creator_id: creatorId,
            batch_key: batchKey,
            gift_count: String(gifts.length),
            fee: String(fee),
            gross: String(gross),
          },
        },
        // Idempotency: a re-run within the same UTC month for the same creator
        // returns the original transfer instead of creating a new one.
        { idempotencyKey: `payout:scheduled:${creatorId}:${batchKey}` }
      )

      // Insert creator_payouts FIRST (smaller blast radius if it fails — gifts
      // stay unsettled, cron retries cleanly next run thanks to idempotency key).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: payoutRow, error: payoutErr } = await (svc as any)
        .from('creator_payouts')
        .insert({
          creator_id: creatorId,
          transfer_id: transfer.id,
          amount_paid: amountPaid,
          fee,
          gross_amount: gross,
          gift_count: gifts.length,
          mode: 'scheduled',
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (payoutErr) {
        await recordAdminIssue({
          kind: 'payout_record_insert_failed',
          severity: 'error',
          title: 'Stripe Transfer succeeded but creator_payouts insert failed',
          description: `Transfer ${transfer.id} for $${amountPaid.toFixed(2)} to ${creatorId} succeeded but the DB row insert failed: ${payoutErr.message}. Gifts will NOT be marked settled and will retry next run — Stripe idempotency will return the same transfer.`,
          context: { creatorId, transferId: transfer.id, amountPaid, fee, dbError: payoutErr.message },
        })
        results.push({ creatorId, ok: false, error: `payout insert: ${payoutErr.message}` })
        continue
      }

      // Now mark all bundled gifts settled. Per-gift settlement_fee is the
      // creator's slice of the flat fee, weighted by gift size.
      const giftIds = gifts.map((g) => g.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: settleErr } = await (svc as any)
        .from('gifts')
        .update({
          settled_at: new Date().toISOString(),
          transfer_id: transfer.id,
          settlement_mode: 'scheduled',
          // settlement_fee is set to a per-gift weighted slice in a follow-up
          // pass below. We do it as a separate UPDATE per gift so each row
          // gets the right amount without a window function.
        })
        .in('id', giftIds)

      if (settleErr) {
        await recordAdminIssue({
          kind: 'payout_gift_settle_failed',
          severity: 'error',
          title: 'creator_payouts row written but gifts.settled_at update failed',
          description: `Transfer ${transfer.id} ($${amountPaid.toFixed(2)}) to ${creatorId} is paid but ${gifts.length} gift rows are still unsettled. Manual fix required: UPDATE gifts SET settled_at=now(), transfer_id='${transfer.id}', settlement_mode='scheduled' WHERE id IN (${giftIds.map((g) => `'${g}'`).join(',')}).`,
          context: { creatorId, transferId: transfer.id, payoutRowId: payoutRow?.id, giftIds, dbError: settleErr.message },
        })
        results.push({ creatorId, ok: false, transferId: transfer.id, error: `settle: ${settleErr.message}` })
        continue
      }

      // Settlement-fee per gift, weighted by share of gross. Skip the loop
      // entirely when the batch fee is 0 (the default for scheduled payouts) —
      // settlement_fee defaults to NULL and that's the correct representation
      // of "no fee was carved." Best-effort otherwise.
      if (fee > 0) {
        for (const gift of gifts) {
          const giftAmount = typeof gift.creator_amount === 'string' ? Number(gift.creator_amount) : gift.creator_amount
          const giftFee = Math.round((fee * (giftAmount / gross)) * 100) / 100
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (svc as any)
            .from('gifts')
            .update({ settlement_fee: giftFee })
            .eq('id', gift.id)
        }
      }

      // Best-effort notification — must not block or fail the cron.
      if (userRow?.email) {
        await sendPayoutNotification({
          creatorEmail: userRow.email,
          creatorName: profile?.display_name ?? 'creator',
          amountPaid,
          fee,
          grossAmount: gross,
          giftCount: gifts.length,
          mode: 'scheduled',
          transferId: transfer.id,
        }).catch((err) => {
          console.error('[payout cron] notification failed', err)
        })
      }

      results.push({
        creatorId,
        ok: true,
        transferId: transfer.id,
        amountPaid,
        fee,
        giftCount: gifts.length,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await recordAdminIssue({
        kind: 'payout_transfer_failed',
        severity: 'error',
        title: 'Stripe Transfer creation failed',
        description: `Failed to create Transfer for creator ${creatorId} ($${amountPaid.toFixed(2)} from $${gross.toFixed(2)} gross): ${msg}`,
        context: { creatorId, gross, amountPaid, fee, batchKey, error: msg },
      })
      results.push({ creatorId, ok: false, error: msg })
    }
  }

  return NextResponse.json({
    batchKey,
    creatorsScanned: byCreator.size,
    creatorsPaid: results.filter((r) => r.ok && !r.skipped).length,
    creatorsSkipped: results.filter((r) => r.skipped).length,
    results,
  })
}
