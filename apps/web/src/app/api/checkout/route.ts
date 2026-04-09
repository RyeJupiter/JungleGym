import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { calculateGiftTotal } from '@junglegym/shared'
import type { PriceTier } from '@junglegym/shared'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { videoId, tier, tipPct } = await request.json() as {
    videoId: string
    tier: PriceTier
    tipPct: number
  }

  // Fetch video to get the price
  const { data: video } = await supabase
    .from('videos')
    .select('price_supported, price_community, price_abundance, title, creator_id')
    .eq('id', videoId)
    .single()

  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

  const priceMap: Record<PriceTier, number | null> = {
    supported: video.price_supported,
    community: video.price_community,
    abundance: video.price_abundance,
  }
  const amountPaid = priceMap[tier]
  if (!amountPaid) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

  const { platformAmount, total } = calculateGiftTotal(amountPaid, tipPct)

  // Check not already purchased
  const { data: existing } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('video_id', videoId)
    .single()

  if (existing) return NextResponse.json({ error: 'Already purchased' }, { status: 400 })

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(total * 100), // cents
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: {
      user_id: user.id,
      video_id: videoId,
      tier,
      amount_paid: amountPaid.toString(),
      platform_tip_pct: tipPct.toString(),
      platform_amount: platformAmount.toString(),
      total_amount: total.toString(),
    },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
