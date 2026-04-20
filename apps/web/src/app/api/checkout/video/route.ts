import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { PLATFORM_FEE_PCT, calculatePriceBreakdown } from '@junglegym/shared'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const stripe = getStripe()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const videoId = typeof body?.videoId === 'string' ? body.videoId.trim() : ''
  const tier = typeof body?.tier === 'string' ? body.tier.trim() : ''

  if (!videoId || !tier) {
    return NextResponse.json({ error: 'videoId and tier required' }, { status: 400 })
  }

  const validTiers = ['supported', 'community', 'abundance']
  if (!validTiers.includes(tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  // Check if user already has active access (ignore expired share redemptions)
  const { data: existing } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('video_id', videoId)
    .or('expires_at.is.null,expires_at.gt.now()')
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
  const videoPrice = priceMap[tier]
  if (!videoPrice) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const { creatorAmount, platformFee, total } = calculatePriceBreakdown(videoPrice)
  const totalCents = Math.round(total * 100)
  const platformFeeCents = Math.round(platformFee * 100)

  // Check if the creator has a connected Stripe account for direct payouts
  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('user_id', video.creator_id)
    .single()

  const hasConnectedAccount =
    creatorProfile?.stripe_account_id && creatorProfile?.stripe_onboarding_complete

  // Build PaymentIntent params — with or without destination charge
  const params: Stripe.PaymentIntentCreateParams = {
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
  }

  // If creator has Stripe Connect, route 80% to them automatically
  if (hasConnectedAccount) {
    params.application_fee_amount = platformFeeCents
    params.transfer_data = {
      destination: creatorProfile.stripe_account_id!,
    }
  }

  const paymentIntent = await stripe.paymentIntents.create(params)

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
