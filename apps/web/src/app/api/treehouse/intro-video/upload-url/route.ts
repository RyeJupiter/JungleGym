import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isStreamEnabled, createDirectUpload } from '@/lib/cloudflare-stream'

// Intro videos are short introductions, not full classes — cap generously
// enough for a 5-minute "who I am and why I teach" piece.
const MAX_INTRO_DURATION_SECONDS = 300

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Server-side defense matching the client-side AddSectionMenu gate:
  // only creators can upload an intro video.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (supabase as any)
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (userRow?.role !== 'creator') {
    return NextResponse.json(
      { error: 'Intro videos are available to creators only.' },
      { status: 403 },
    )
  }

  if (!isStreamEnabled()) {
    return NextResponse.json(
      { error: 'Video uploads are temporarily unavailable.' },
      { status: 503 },
    )
  }

  try {
    const { uploadURL, uid } = await createDirectUpload({
      maxDurationSeconds: MAX_INTRO_DURATION_SECONDS,
      creator: user.id,
      meta: { purpose: 'treehouse_intro', user_id: user.id },
    })
    return NextResponse.json({ uploadURL, uid })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create upload URL'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
