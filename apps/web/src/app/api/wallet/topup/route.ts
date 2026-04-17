import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { calculateTopUpTotal, WALLET_TOPUP_FEE_PCT } from '@junglegym/shared'

/**
 * POST /api/wallet/topup
 *
 * Creates a Stripe PaymentIntent for a wallet top-up.
 * The user picks how much they want in their wallet (e.g. $25),
 * a 7% service fee is added on top, and Stripe charges the total.
 */
export async function POST(req: Request) {
  const stripe = getStripe()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const walletAmount = typeof body?.amount === 'number' ? body.amount : 0

  if (walletAmount < 1) {
    return NextResponse.json({ error: 'Minimum top-up is $1' }, { status: 400 })
  }

  if (walletAmount > 500) {
    return NextResponse.json({ error: 'Maximum top-up is $500' }, { status: 400 })
  }

  const { fee, chargeTotal } = calculateTopUpTotal(walletAmount)
  const chargeCents = Math.round(chargeTotal * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: chargeCents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: {
      type: 'wallet_topup',
      user_id: user.id,
      wallet_amount: String(walletAmount),
      fee: String(fee),
      fee_pct: String(WALLET_TOPUP_FEE_PCT),
      charge_total: String(chargeTotal),
    },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
