import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Cloudflare Stream webhook handler.
 *
 * Events: live_input.connected, live_input.disconnected, live_input.errored
 *
 * Uses service role client since webhooks have no user auth context.
 */
export async function POST(request: Request) {
  // Verify webhook secret (simple shared-secret header check)
  const webhookSecret = process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET
  if (webhookSecret) {
    const sig = request.headers.get('cf-webhook-auth') ?? request.headers.get('x-webhook-secret')
    if (sig !== webhookSecret) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
  }

  const body = await request.json()
  const eventType = body?.data?.event_type as string | undefined
  const inputId = body?.data?.input_id as string | undefined

  if (!eventType || !inputId) {
    return NextResponse.json({ error: 'Missing event data' }, { status: 400 })
  }

  // Service role client for webhook — no user context
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  const supabase = createClient(supabaseUrl, serviceKey)

  // Find the session by its Cloudflare input ID
  const { data: session } = await supabase
    .from('live_sessions')
    .select('id, status')
    .eq('cf_input_id', inputId)
    .single()

  if (!session) {
    // Unknown input — could be from a different service or deleted session
    return NextResponse.json({ ok: true, skipped: true })
  }

  let newStatus: string | null = null

  switch (eventType) {
    case 'live_input.connected':
      newStatus = 'live'
      break
    case 'live_input.disconnected':
      // Only auto-complete if currently live (don't override manual status changes)
      if (session.status === 'live') {
        newStatus = 'completed'
      }
      break
    case 'live_input.errored':
      // Log but don't change status — creator may reconnect
      console.error(`[CF Stream] Error on input ${inputId}:`, body?.data?.live_input_errored)
      break
  }

  if (newStatus && newStatus !== session.status) {
    await supabase
      .from('live_sessions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', session.id)
  }

  return NextResponse.json({ ok: true, event: eventType, newStatus })
}
