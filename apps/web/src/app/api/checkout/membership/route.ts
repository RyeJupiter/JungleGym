import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const stripe = getStripe()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Block if already an active member
  const { data: existing } = await supabase
    .from('memberships')
    .select('id, status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already a member' }, { status: 409 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://junglegym.academy'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          recurring: { interval: 'month' },
          unit_amount: 10000, // $100.00
          product_data: {
            name: 'JungleGym Membership',
            description: 'Access to 6 videos of your choice each month. 80% goes directly to creators.',
          },
        },
      },
    ],
    metadata: {
      type: 'membership',
      user_id: user.id,
    },
    success_url: `${siteUrl}/library?membership=welcome`,
    cancel_url: `${siteUrl}/#membership`,
  })

  return NextResponse.json({ url: session.url })
}
