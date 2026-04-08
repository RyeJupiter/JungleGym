import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { PLATFORM_FEE_PCT, calculatePriceBreakdown } from '@junglegym/shared'
import type { PriceTier } from '@junglegym/shared'

export async function POST(req: Request) {
  const stripe = getStripe()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { videoId, tier } = body ?? {}

  if (!videoId || !tier) {
    return NextResponse.json({ error: 'videoId and tier required' }, { status: 400 })
  }

  // Check if user already owns this video
  const { data: existing } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('video_id', videoId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You already own this video' }, { status: 409 })
  }

  const { data: video } = await supabase
    .from('videos')
    .select('id, title, thumbnail_url, price_supported, price_community, price_abundance, creator_id')
    .eq('id', videoId)
    .eq('published', true)
    .single()

  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  const priceMap: Record<string, number | null> = {
    supported: video.price_supported,
    community: video.price_community,
    abundance: video.price_abundance,
  }
  const videoPrice = priceMap[tier as PriceTier]
  if (!videoPrice) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const { creatorAmount, platformFee, total } = calculatePriceBreakdown(videoPrice)
  const totalCents = Math.round(total * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: {
      type: 'video_purchase',
      user_id: user.id,
      video_id: videoId,
      tier,
      fee_pct: String(PLATFORM_FEE_PCT),
      video_price: String(creatorAmount),
      platform_amount: String(platformFee),
      total_amount: String(total),
    },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
