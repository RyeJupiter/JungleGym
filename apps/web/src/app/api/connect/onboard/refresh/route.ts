import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { SITE_URL } from '@/lib/siteUrl'

/**
 * GET /api/connect/onboard/refresh
 *
 * When a Stripe Account Link expires or was already used, Stripe redirects
 * here. We generate a fresh link and redirect the creator back to Stripe.
 */
export async function GET() {
  const stripe = getStripe()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${SITE_URL}/auth/login`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.stripe_account_id) {
    // No account yet — send them back to settings to start over
    return NextResponse.redirect(`${SITE_URL}/settings?tab=payments&stripe=error`)
  }

  const accountLink = await stripe.accountLinks.create({
    account: profile.stripe_account_id,
    refresh_url: `${SITE_URL}/api/connect/onboard/refresh`,
    return_url: `${SITE_URL}/settings?stripe=complete`,
    type: 'account_onboarding',
  })

  return NextResponse.redirect(accountLink.url)
}
