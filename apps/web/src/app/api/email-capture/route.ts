import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { rateLimit, clientIp } from '@/lib/rateLimit'

export async function POST(req: Request) {
  // 5 submissions per IP per 10 minutes. See rateLimit.ts caveats — this is
  // edge-isolate-local, not a hard guarantee. Layer CF WAF for real limits.
  const rl = rateLimit(`email-capture:${clientIp(req)}`, 5, 10 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    )
  }

  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const source = typeof body?.source === 'string' ? body.source : 'homepage'

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  // Service role — anon insert path tripped PostgREST's read-back check on a
  // table with no SELECT policy. Inserts don't need user context anyway; the
  // rate limit above is what gates abuse.
  const svc = createServiceSupabaseClient()
  const { error } = await svc
    .from('email_captures')
    .insert({ email, source })

  // Ignore duplicate — already signed up is still a success from UX perspective
  if (error && !error.message.includes('unique') && !error.message.includes('duplicate')) {
    console.error('[email-capture] insert failed:', error)
    return NextResponse.json({ error: 'Failed to save email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
