import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { PLATFORM_FEE_PCT } from '@junglegym/shared'
import type { PriceTier } from '@junglegym/shared'

export async function POST(req: Request) {
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

  const platformAmount = Math.round((videoPrice * PLATFORM_FEE_PCT) / 100 * 100) / 100
  const totalCents = Math.round((videoPrice + platformAmount) * 100)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://junglegym.academy'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: totalCents,
          product_data: {
            name: video.title,
            description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} tier · 80% to creator, 20% to platform`,
            ...(video.thumbnail_url ? { images: [video.thumbnail_url] } : {}),
          },
        },
      },
    ],
    metadata: {
      type: 'video_purchase',
      user_id: user.id,
      video_id: videoId,
      tier,
      tip_pct: String(PLATFORM_FEE_PCT),
      video_price: String(videoPrice),
      platform_amount: String(platformAmount),
      total_amount: String(videoPrice + platformAmount),
    },
    success_url: `${siteUrl}/video/${videoId}?purchase=success`,
    cancel_url: `${siteUrl}/video/${videoId}`,
  })

  return NextResponse.json({ url: session.url })
}
