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
  const body = await request.json()
  const eventType = body?.data?.event_type as string | undefined
  const inputId = body?.data?.input_id as string | undefined

  if (!eventType || !inputId) {
    return NextResponse.json({ error: 'Missing event data' }, { status: 400 })
  }

  // Verify webhook secret — CF Stream sends it in cf-webhook-auth header.
  // Accept if: no secret configured (dev), or header matches.
  const webhookSecret = process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET
  if (webhookSecret) {
    const cfAuth = request.headers.get('cf-webhook-auth')
    if (cfAuth !== webhookSecret) {
      console.error(`[CF Stream Webhook] Auth failed. Header: ${cfAuth?.slice(0, 10)}...`)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
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
    return NextResponse.json({ ok: true, skipped: true })
  }

  let newStatus: string | null = null

  switch (eventType) {
    case 'live_input.connected':
      newStatus = 'live'
      break
    case 'live_input.disconnected':
      if (session.status === 'live') {
        newStatus = 'completed'
      }
      break
    case 'live_input.errored':
      console.error(`[CF Stream] Error on input ${inputId}:`, body?.data)
      break
  }

  if (newStatus && newStatus !== session.status) {
    const { error } = await supabase
      .from('live_sessions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', session.id)

    if (error) {
      console.error(`[CF Stream Webhook] DB update failed:`, error)
    }
  }

  return NextResponse.json({ ok: true, event: eventType, newStatus })
}
