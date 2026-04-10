import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { PLATFORM_FEE_PCT, calculatePriceBreakdown } from '@junglegym/shared'

export async function POST(req: Request) {
  const stripe = getStripe()
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

  // Verify session exists
  const { data: session } = await supabase
    .from('live_sessions')
    .select('id, creator_id, title')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const { creatorAmount, platformFee, total } = calculatePriceBreakdown(amount)
  const totalCents = Math.round(total * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: {
      type: 'gift',
      user_id: user.id,
      session_id: sessionId,
      creator_id: session.creator_id,
      fee_pct: String(PLATFORM_FEE_PCT),
      creator_amount: String(creatorAmount),
      platform_amount: String(platformFee),
      total_amount: String(total),
      message,
    },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
