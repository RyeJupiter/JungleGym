import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

/**
 * GET /api/connect/status
 *
 * Returns the current Stripe Connect status for the logged-in creator.
 * If an account exists but onboarding isn't marked complete, checks Stripe
 * directly and updates the DB (handles the case where the webhook hasn't
 * fired yet when the user returns from onboarding).
 */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // No Stripe account at all
  if (!profile.stripe_account_id) {
    return NextResponse.json({ status: 'not_connected' })
  }

  // Already confirmed complete
  if (profile.stripe_onboarding_complete) {
    return NextResponse.json({ status: 'connected' })
  }

  // Account exists but not marked complete — check Stripe directly
  const stripe = getStripe()
  const account = await stripe.accounts.retrieve(profile.stripe_account_id)

  if (account.charges_enabled && account.details_submitted) {
    // Update DB — webhook may not have fired yet
    const svc = createServiceSupabaseClient()
    await svc
      .from('profiles')
      .update({ stripe_onboarding_complete: true })
      .eq('user_id', user.id)

    return NextResponse.json({ status: 'connected' })
  }

  return NextResponse.json({ status: 'pending' })
}
