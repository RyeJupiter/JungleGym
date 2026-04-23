import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { deleteStreamVideo } from '@/lib/cloudflare-stream'

/**
 * Persist a Stream UID into the user's treehouse_config *immediately* on
 * upload success. Decoupling this from the editor's batched Save means a
 * creator who navigates away after uploading doesn't orphan the upload —
 * their profile is updated atomically the moment the file reaches CF.
 *
 * Also deletes the previous Stream video in the same section (if any) so
 * replacing an intro doesn't leak CF Stream billing.
 *
 * Body: { sectionId: string, streamUid: string }
 * - sectionId: the client-side id of the intro_video section in the user's
 *   treehouse_config. If it's already in the saved config we update that
 *   section in place; otherwise we append a new one.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const sectionId = body?.sectionId
  const streamUid: string | null = body?.streamUid ?? null
  // Optional video dimensions — used so the renderer can lay out portrait
  // and landscape videos with the right aspect ratio instead of black-boxing.
  const width = typeof body?.width === 'number' && body.width > 0 ? body.width : null
  const height = typeof body?.height === 'number' && body.height > 0 ? body.height : null
  if (typeof sectionId !== 'string') {
    return NextResponse.json({ error: 'sectionId is required' }, { status: 400 })
  }
  if (streamUid !== null && typeof streamUid !== 'string') {
    return NextResponse.json({ error: 'streamUid must be a string or null' }, { status: 400 })
  }

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('treehouse_config')
    .eq('user_id', user.id)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = (profile?.treehouse_config ?? { version: 1, theme: 'jungle', sections: [] }) as any
  const sections: Array<Record<string, unknown>> = Array.isArray(config.sections) ? [...config.sections] : []

  const idx = sections.findIndex((s) => s.id === sectionId && s.type === 'intro_video')
  let previousUid: string | null = null

  const nextData: Record<string, unknown> | null = streamUid
    ? { streamUid, ...(width && height ? { width, height } : {}) }
    : null

  if (idx >= 0) {
    const prev = sections[idx].data as { streamUid?: string } | undefined
    previousUid = prev?.streamUid ?? null
    sections[idx] = {
      ...sections[idx],
      data: nextData ?? {},
    }
  } else if (nextData) {
    // Section didn't exist in the saved config yet — add it. Visible by
    // default so the creator sees their video without a second action.
    sections.push({
      id: sectionId,
      type: 'intro_video',
      visible: true,
      data: nextData,
    })
  }
  // If streamUid is null AND section doesn't exist, there's nothing to do.

  const nextConfig = { ...config, sections }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('profiles')
    .update({ treehouse_config: nextConfig })
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Best-effort cleanup of the previous Stream video. Fire-and-forget —
  // a failed delete is just a billing orphan, not user-visible.
  if (previousUid && previousUid !== streamUid) {
    deleteStreamVideo(previousUid).catch(() => {})
  }

  return NextResponse.json({ ok: true, config: nextConfig })
}
