import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Updates stream status: pause, resume, or end.
 * Called by the BrowserStreamClient when the creator interacts with controls.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { sessionId, action } = await request.json()

  if (!sessionId || !['pause', 'resume', 'end'].includes(action)) {
    return NextResponse.json({ error: 'sessionId and action (pause|resume|end) required' }, { status: 400 })
  }

  // Verify ownership
  const { data: session } = await supabase
    .from('live_sessions')
    .select('id, status')
    .eq('id', sessionId)
    .eq('creator_id', user.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const now = new Date().toISOString()

  if (action === 'pause') {
    await supabase
      .from('live_sessions')
      .update({ paused_at: now, updated_at: now })
      .eq('id', sessionId)
  } else if (action === 'resume') {
    await supabase
      .from('live_sessions')
      .update({ paused_at: null, updated_at: now })
      .eq('id', sessionId)
  } else if (action === 'end') {
    await supabase
      .from('live_sessions')
      .update({ status: 'completed', paused_at: null, updated_at: now })
      .eq('id', sessionId)
  }

  return NextResponse.json({ ok: true, action })
}
