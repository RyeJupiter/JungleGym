import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

// Hard-delete videos that were soft-deleted more than 30 days ago:
// row + video file + thumbnail + audio chunks + VTT.
//
// Triggered by GitHub Actions cron (see .github/workflows/purge-deleted-videos.yml).
// Protected by a shared CRON_SECRET header — Worker secret on CF, GH secret
// on the workflow side. No user session, so we use the service client.

const PURGE_AGE_DAYS = 30

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  const auth = request.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const svc = createServiceSupabaseClient()
  const cutoff = new Date(Date.now() - PURGE_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await (svc as any)
    .from('videos')
    .select('id, creator_id, video_url, thumbnail_url, transcript_vtt_path')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoff)

  if (error) {
    return NextResponse.json({ error: `query failed: ${error.message}` }, { status: 500 })
  }

  type Row = {
    id: string
    creator_id: string
    video_url: string | null
    thumbnail_url: string | null
    transcript_vtt_path: string | null
  }
  const videos = (rows ?? []) as Row[]

  const results: Array<{ id: string; ok: boolean; details?: string }> = []

  for (const video of videos) {
    const errors: string[] = []

    // 1. Video file in the private `videos` bucket. The row stores the
    //    bare object path (e.g. "creator_id/video_id.mp4").
    if (video.video_url && !video.video_url.startsWith('http')) {
      const { error: vErr } = await svc.storage.from('videos').remove([video.video_url])
      if (vErr) errors.push(`video file: ${vErr.message}`)
    }

    // 2. Thumbnail — stored as a full public URL on the row. Convert back
    //    to a bucket-relative path by splitting on the bucket name.
    if (video.thumbnail_url) {
      const marker = '/thumbnails/'
      const idx = video.thumbnail_url.indexOf(marker)
      if (idx !== -1) {
        const thumbPath = video.thumbnail_url.slice(idx + marker.length).split('?')[0]
        const { error: tErr } = await svc.storage.from('thumbnails').remove([thumbPath])
        if (tErr) errors.push(`thumbnail: ${tErr.message}`)
      }
    }

    // 3. VTT file.
    if (video.transcript_vtt_path) {
      const { error: vttErr } = await svc.storage.from('transcripts').remove([video.transcript_vtt_path])
      if (vttErr) errors.push(`vtt: ${vttErr.message}`)
    }

    // 4. Audio chunks — list the folder, delete everything under it.
    //    Path convention: transcripts/audio/{creator_id}/{video_id}/NNN.webm
    const audioPrefix = `audio/${video.creator_id}/${video.id}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: chunkList, error: listErr } = await (svc.storage as any)
      .from('transcripts')
      .list(audioPrefix, { limit: 100 })
    if (listErr) {
      errors.push(`audio list: ${listErr.message}`)
    } else if (chunkList && chunkList.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paths = (chunkList as any[]).map((f) => `${audioPrefix}/${f.name}`)
      const { error: rmErr } = await svc.storage.from('transcripts').remove(paths)
      if (rmErr) errors.push(`audio chunks: ${rmErr.message}`)
    }

    // 5. Row — we purge it regardless of storage errors so we don't loop
    //    forever on a single broken record. Storage errors are surfaced
    //    in the response for visibility.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: delErr } = await (svc as any).from('videos').delete().eq('id', video.id)
    if (delErr) {
      errors.push(`row delete: ${delErr.message}`)
      results.push({ id: video.id, ok: false, details: errors.join('; ') })
    } else {
      results.push({
        id: video.id,
        ok: true,
        ...(errors.length ? { details: `row purged with storage warnings: ${errors.join('; ')}` } : {}),
      })
    }
  }

  return NextResponse.json({
    cutoff,
    scanned: videos.length,
    purged: results.filter((r) => r.ok).length,
    results,
  })
}
