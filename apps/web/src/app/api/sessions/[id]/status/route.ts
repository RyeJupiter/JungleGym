import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const PAUSE_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Returns the current status of a session. Used by the client-side
 * poller to detect when a session goes live or ends.
 *
 * Also acts as a server-side cleanup: if paused_at is older than 15 min,
 * auto-completes the session. This handles cases where the creator's
 * browser crashed, tab was closed, or internet was lost.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: session } = await supabase
    .from('live_sessions')
    .select('status, paused_at, creator_id')
    .eq('id', id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const pausedAt = (session as Record<string, unknown>).paused_at as string | null
  let status = session.status

  // Server-side auto-complete: if paused for longer than 15 minutes.
  // Only the session owner may trigger this write — otherwise any caller
  // with a session id could force-complete a paused stream.
  if (status === 'live' && pausedAt) {
    const pausedMs = Date.now() - new Date(pausedAt).getTime()
    if (pausedMs >= PAUSE_TIMEOUT_MS) {
      const { data: { user } } = await supabase.auth.getUser()
      const creatorId = (session as Record<string, unknown>).creator_id as string
      if (user && user.id === creatorId) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (supabaseUrl && serviceKey) {
          const svc = createClient(supabaseUrl, serviceKey)
          await svc
            .from('live_sessions')
            .update({ status: 'completed', paused_at: null, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('status', 'live')
          status = 'completed'
        }
      }
    }
  }

  return NextResponse.json({ status, paused: !!pausedAt && status === 'live' })
}
