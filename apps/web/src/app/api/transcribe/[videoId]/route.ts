import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { NextResponse, after } from 'next/server'
import { transcribeChunk, mergeTranscriptions, toWebVTT } from '@/lib/transcribe'
import { fetchGhostTags } from '@/lib/ghostTags'
import { checkIsAdmin } from '@/lib/admin'

const MAX_ATTEMPTS = 2 // initial + one automatic retry; further retries are manual via admin panel

/**
 * Kick off transcription for a video.
 *
 * Body: { audioPaths: string[] } — ordered list of storage paths in the
 * 'transcripts' bucket, one per 15-minute chunk produced by the browser
 * extractor. If audioPaths is empty or missing, the route attempts to
 * discover chunks via a service-role list (used by the admin retry path
 * after the creator already uploaded audio).
 *
 * Returns 202 immediately and runs the Groq + DB work in after().
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { audioPaths?: string[] }

  // Ownership check: caller must be the video's creator OR an admin
  // retrying from the Issues panel.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: videoRaw } = await (supabase as any)
    .from('videos')
    .select('id, creator_id, title, description, tags')
    .eq('id', videoId)
    .maybeSingle()

  if (!videoRaw) return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  const video = videoRaw as {
    id: string
    creator_id: string
    title: string
    description: string | null
    tags: string[] | null
  }

  const isOwner = video.creator_id === user.id
  const isAdmin = user.email ? await checkIsAdmin(user.email, supabase) : false
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) {
    // No key configured — mark failed immediately so admin sees it rather
    // than silently staying 'pending'.
    const admin = createServiceSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('videos')
      .update({
        transcript_status: 'failed',
        transcript_error: 'GROQ_API_KEY not configured',
      })
      .eq('id', videoId)
    return NextResponse.json({ error: 'Transcription not configured' }, { status: 503 })
  }

  // Mark processing right away so duplicate triggers (e.g. double-click
  // on admin retry) don't fan out into parallel Groq calls. Also clear
  // transcript_issue_dismissed_at so that if this retry fails again, the
  // new failure resurfaces on the admin Issues panel instead of staying
  // hidden by a prior dismissal.
  const admin = createServiceSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lockRow } = await (admin as any)
    .from('videos')
    .update({
      transcript_status: 'processing',
      transcript_error: null,
      transcript_issue_dismissed_at: null,
    })
    .eq('id', videoId)
    .select('transcript_attempts')
    .single()

  const startingAttempts = (lockRow?.transcript_attempts as number | undefined) ?? 0

  // Run the heavy work after the response is sent. after() keeps the
  // request alive on Cloudflare Workers via waitUntil semantics.
  after(async () => {
    await runTranscription({
      videoId,
      creatorId: video.creator_id,
      title: video.title,
      description: video.description ?? '',
      userTags: video.tags ?? [],
      audioPaths: body.audioPaths ?? [],
      groqKey,
      startingAttempts,
    })
  })

  return NextResponse.json({ status: 'processing' }, { status: 202 })
}

async function runTranscription(opts: {
  videoId: string
  creatorId: string
  title: string
  description: string
  userTags: string[]
  audioPaths: string[]
  groqKey: string
  startingAttempts: number
}): Promise<void> {
  const { videoId, title, description, userTags, groqKey } = opts
  const admin = createServiceSupabaseClient()

  let attempts = opts.startingAttempts

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markFailed = async (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('videos')
      .update({
        transcript_status: 'failed',
        transcript_error: message.slice(0, 500),
        transcript_attempts: attempts,
      })
      .eq('id', videoId)
  }

  while (attempts < MAX_ATTEMPTS) {
    attempts += 1
    try {
      // Resolve audio paths — if client passed them, use those; otherwise
      // list the folder (admin retry after client already uploaded chunks).
      let paths = opts.audioPaths
      if (!paths.length) {
        const prefix = `audio/${opts.creatorId}/${videoId}`
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: listed } = await (admin as any).storage
          .from('transcripts')
          .list(prefix, { limit: 100, sortBy: { column: 'name', order: 'asc' } })
        paths = (listed ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((f: any) => f.name && f.name.endsWith('.webm'))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((f: any) => `${prefix}/${f.name}`)
      }

      if (!paths.length) throw new Error('No audio chunks found for this video')

      // Download each chunk through service role (bucket is public-read
      // so we could fetch via URL too, but service role avoids a public
      // HTTP roundtrip).
      const downloaded: Array<{ startSeconds: number; blob: Blob }> = []
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i]
        const { data, error } = await admin.storage.from('transcripts').download(path)
        if (error || !data) throw new Error(`Download failed for ${path}: ${error?.message ?? 'unknown'}`)
        // Chunk index from filename (e.g. "000.webm" → 0). Falls back to
        // array index if the filename isn't numeric.
        const match = path.match(/(\d{3})\.webm$/)
        const chunkIndex = match ? parseInt(match[1], 10) : i
        downloaded.push({ startSeconds: chunkIndex * 900, blob: data })
      }

      // Transcribe sequentially to stay under Groq's rate limits and
      // keep memory use bounded — each chunk is ~5MB, we don't want
      // all of them in flight at once.
      const transcriptions: Array<{ startSeconds: number; transcription: Awaited<ReturnType<typeof transcribeChunk>> }> = []
      for (const { startSeconds, blob } of downloaded) {
        const t = await transcribeChunk(blob, groqKey)
        transcriptions.push({ startSeconds, transcription: t })
      }

      const merged = mergeTranscriptions(transcriptions)
      const vtt = toWebVTT(merged)
      const vttPath = `vtt/${videoId}.vtt`

      const { error: uploadErr } = await admin.storage
        .from('transcripts')
        .upload(vttPath, new Blob([vtt], { type: 'text/vtt' }), {
          contentType: 'text/vtt',
          upsert: true,
        })
      if (uploadErr) throw new Error(`VTT upload failed: ${uploadErr.message}`)

      // Regenerate ghost tags from the transcript. Failure here does
      // not block transcript completion — tags just stay as the
      // title-based set from video creation.
      let newGhostTags: string[] | null = null
      try {
        const tags = await fetchGhostTags(title, description, userTags, merged.text)
        if (tags.length) newGhostTags = tags
      } catch {
        // swallow — transcript still succeeded
      }

      const update: Record<string, unknown> = {
        transcript_text: merged.text,
        transcript_vtt_path: vttPath,
        transcript_status: 'completed',
        transcript_error: null,
        transcript_attempts: attempts,
      }
      if (newGhostTags) update.ghost_tags = newGhostTags

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateErr } = await (admin as any)
        .from('videos')
        .update(update)
        .eq('id', videoId)
      if (updateErr) throw new Error(`Row update failed: ${updateErr.message}`)

      return // success
    } catch (err) {
      console.warn(`Transcription attempt ${attempts} failed for ${videoId}:`, err)
      if (attempts >= MAX_ATTEMPTS) {
        await markFailed(err)
        return
      }
      // brief backoff before retry
      await new Promise((r) => setTimeout(r, 1500))
    }
  }
}
