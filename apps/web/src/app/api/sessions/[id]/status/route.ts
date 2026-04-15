import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Returns the current status of a session. Used by the client-side
 * poller to detect when a session goes live or ends.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: session } = await supabase
    .from('live_sessions')
    .select('status, paused_at')
    .eq('id', id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const paused_at = (session as Record<string, unknown>).paused_at as string | null

  return NextResponse.json({ status: session.status, paused: !!paused_at })
}
