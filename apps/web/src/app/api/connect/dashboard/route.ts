import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

/**
 * GET /api/connect/dashboard
 *
 * Generates a Stripe Express Dashboard login link for the current creator.
 * Redirects them to the Stripe-hosted dashboard where they can view payouts,
 * update bank info, and manage their account.
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
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('user_id', user.id)
    .single()

  if (!profile?.stripe_account_id || !profile.stripe_onboarding_complete) {
    return NextResponse.redirect(new URL('/settings?tab=payments&stripe=not-connected', req.url))
  }

  const loginLink = await stripe.accounts.createLoginLink(profile.stripe_account_id)

  return NextResponse.redirect(loginLink.url)
}
