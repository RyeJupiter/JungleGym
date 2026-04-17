import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

/**
 * POST /api/connect/onboard
 *
 * Creates a Stripe Connect Express account for the current creator (or reuses
 * an existing one) and returns a Stripe-hosted Account Link URL for onboarding.
 */
export async function POST(req: Request) {
  const stripe = getStripe()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the user is a creator
  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userRow?.role !== 'creator') {
    return NextResponse.json({ error: 'Only creators can connect Stripe' }, { status: 403 })
  }

  // Fetch profile to check for existing Stripe account
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete, username')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  let accountId = profile.stripe_account_id

  // Create a new Express account if one doesn't exist
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        junglegym_user_id: user.id,
        junglegym_username: profile.username,
      },
    })

    accountId = account.id

    // Save the account ID to the profile (use service client to bypass RLS)
    const svc = createServiceSupabaseClient()
    await svc
      .from('profiles')
      .update({ stripe_account_id: accountId })
      .eq('user_id', user.id)
  }

  // Parse origin from request for return/refresh URLs
  const origin = req.headers.get('origin') || 'https://junglegym.academy'

  // Generate the Account Link (single-use, temporary)
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/api/connect/onboard/refresh`,
    return_url: `${origin}/settings?stripe=complete`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
