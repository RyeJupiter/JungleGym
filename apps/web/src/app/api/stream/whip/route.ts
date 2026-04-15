import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getWhipUrl } from '@/lib/cloudflare-stream'

/**
 * Proxies WHIP signaling to Cloudflare Stream.
 * The browser can't POST directly to CF's WHIP endpoint due to CORS,
 * so we relay the SDP offer/answer through our own origin.
 *
 * The stream key is fetched from the database server-side — it never
 * needs to be sent from the client for this flow.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const url = new URL(request.url)
  const sessionId = url.searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  // Fetch session — verifies ownership and gets stream credentials
  const { data: session } = await supabase
    .from('live_sessions')
    .select('id, cf_input_id, cf_stream_key')
    .eq('id', sessionId)
    .eq('creator_id', user.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const cfInputId = (session as Record<string, unknown>).cf_input_id as string | null
  const cfStreamKey = (session as Record<string, unknown>).cf_stream_key as string | null

  if (!cfInputId || !cfStreamKey) {
    return NextResponse.json({ error: 'Stream not provisioned for this session' }, { status: 400 })
  }

  const whipUrl = getWhipUrl(cfInputId)
  if (!whipUrl) {
    return NextResponse.json({ error: 'Streaming not configured' }, { status: 503 })
  }

  // Forward the SDP offer to Cloudflare's WHIP endpoint
  const sdpOffer = await request.text()

  const cfResponse = await fetch(whipUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sdp',
      'Authorization': `Bearer ${cfStreamKey}`,
    },
    body: sdpOffer,
  })

  if (!cfResponse.ok) {
    const errText = await cfResponse.text().catch(() => '')
    return new Response(errText || 'WHIP connection failed', {
      status: cfResponse.status,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // Return the SDP answer
  const sdpAnswer = await cfResponse.text()
  return new Response(sdpAnswer, {
    status: 201,
    headers: { 'Content-Type': 'application/sdp' },
  })
}
