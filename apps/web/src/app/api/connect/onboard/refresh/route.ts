import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

/**
 * GET /api/connect/onboard/refresh
 *
 * When a Stripe Account Link expires or was already used, Stripe redirects
 * here. We generate a fresh link and redirect the creator back to Stripe.
 */
export async function GET(req: Request) {
  const stripe = getStripe()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.stripe_account_id) {
    // No account yet — send them back to settings to start over
    return NextResponse.redirect(new URL('/settings?stripe=error', req.url))
  }

  const origin = new URL(req.url).origin

  const accountLink = await stripe.accountLinks.create({
    account: profile.stripe_account_id,
    refresh_url: `${origin}/api/connect/onboard/refresh`,
    return_url: `${origin}/settings?stripe=complete`,
    type: 'account_onboarding',
  })

  return NextResponse.redirect(accountLink.url)
}
