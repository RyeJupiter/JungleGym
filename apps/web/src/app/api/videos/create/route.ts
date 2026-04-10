import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse, after } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchGhostTags } from '@/lib/ghostTags'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const {
    id: videoId,
    title,
    description,
    tags = [],
    duration_seconds,
    is_free,
    price_supported,
    price_community,
    price_abundance,
    video_url,
    thumbnail_url,
  } = body

  if (!videoId || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const videoRow = {
    id: videoId,
    creator_id: user.id,
    title,
    description: description || null,
    tags,
    duration_seconds: duration_seconds || null,
    is_free: is_free ?? false,
    price_supported: price_supported ?? null,
    price_community: price_community ?? null,
    price_abundance: price_abundance ?? null,
    video_url: video_url ?? null,
    thumbnail_url: thumbnail_url ?? null,
    published: false,
  }

  // Blocking call — fast with llama-3.1-8b-instant, 5s timeout
  let ghostTags: string[] = []
  let groqFailed = false
  try {
    ghostTags = await fetchGhostTags(title, description ?? '', tags)
  } catch {
    groqFailed = true
  }

  const { error: insertError } = await supabase
    .from('videos')
    .insert({ ...videoRow, ghost_tags: ghostTags })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Fire-and-forget fallback: Groq was unreachable — retry after response is sent
  if (groqFailed) {
    after(async () => {
      try {
        const retryTags = await fetchGhostTags(title, description ?? '', tags, 15000)
        if (!retryTags.length) return
        // Use service role — request context is gone, no cookies available
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )
        await admin.from('videos').update({ ghost_tags: retryTags }).eq('id', videoId)
      } catch {
        // give up silently
      }
    })
  }

  return NextResponse.json({ id: videoId })
}
