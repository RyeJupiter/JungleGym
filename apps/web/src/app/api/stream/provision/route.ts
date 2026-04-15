import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isStreamEnabled, provisionLiveInput, getWhipUrl } from '@/lib/cloudflare-stream'

export async function POST(request: Request) {
  // 1. Auth
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // 2. Parse body
  const body = await request.json()
  const { sessionId } = body
  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  // 3. Verify ownership
  const { data: session } = await supabase
    .from('live_sessions')
    .select('id, title, creator_id, cf_input_id')
    .eq('id', sessionId)
    .eq('creator_id', user.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Already provisioned
  if (session.cf_input_id) {
    return NextResponse.json({ error: 'Stream already set up for this session' }, { status: 409 })
  }

  // 4. Check if Stream is enabled
  if (!isStreamEnabled()) {
    return NextResponse.json(
      { error: 'Live streaming is not yet enabled. Coming soon!' },
      { status: 503 }
    )
  }

  // 5. Provision on Cloudflare
  try {
    const { inputId, rtmpsUrl, streamKey } = await provisionLiveInput(session.title)

    // 6. Store credentials
    const { error: updateError } = await supabase
      .from('live_sessions')
      .update({
        cf_input_id: inputId,
        cf_stream_key: streamKey,
      })
      .eq('id', sessionId)

    if (updateError) throw updateError

    return NextResponse.json({
      inputId,
      rtmpsUrl,
      streamKey,
      whipUrl: getWhipUrl(inputId),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to provision stream'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
