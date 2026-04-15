import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSignedWhipUrl } from '@/lib/cloudflare-stream'

/**
 * Proxies WHIP signaling to Cloudflare Stream.
 * The browser can't POST directly to CF's WHIP endpoint due to CORS,
 * so we relay the SDP offer/answer through our own origin.
 *
 * CF's WHIP URL is a signed URL (auth token baked into the path) —
 * no separate Authorization header is needed.
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

  // Fetch session — verifies ownership
  const { data: session } = await supabase
    .from('live_sessions')
    .select('id, cf_input_id')
    .eq('id', sessionId)
    .eq('creator_id', user.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const cfInputId = (session as Record<string, unknown>).cf_input_id as string | null
  if (!cfInputId) {
    return NextResponse.json({ error: 'Stream not provisioned for this session' }, { status: 400 })
  }

  // Get the signed WHIP URL from CF API (contains auth token in the path)
  const whipUrl = await getSignedWhipUrl(cfInputId)
  if (!whipUrl) {
    return NextResponse.json({ error: 'Failed to get streaming URL' }, { status: 503 })
  }

  // Forward the SDP offer to Cloudflare's WHIP endpoint
  const sdpOffer = await request.text()

  const cfResponse = await fetch(whipUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
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
