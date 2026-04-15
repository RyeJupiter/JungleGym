import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getWhipUrl } from '@/lib/cloudflare-stream'

/**
 * Proxies WHIP signaling to Cloudflare Stream.
 * The browser can't POST directly to CF's WHIP endpoint due to CORS,
 * so we relay the SDP offer/answer through our own origin.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const url = new URL(request.url)
  const inputId = url.searchParams.get('inputId')
  const streamKey = url.searchParams.get('streamKey')

  if (!inputId || !streamKey) {
    return NextResponse.json({ error: 'inputId and streamKey are required' }, { status: 400 })
  }

  const whipUrl = getWhipUrl(inputId)
  if (!whipUrl) {
    return NextResponse.json({ error: 'Streaming not configured' }, { status: 503 })
  }

  // Verify the user owns this session
  const { data: session } = await supabase
    .from('live_sessions')
    .select('id')
    .eq('cf_input_id', inputId)
    .eq('creator_id', user.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Forward the SDP offer to Cloudflare's WHIP endpoint
  const sdpOffer = await request.text()

  const cfResponse = await fetch(whipUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sdp',
      'Authorization': `Bearer ${streamKey}`,
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
