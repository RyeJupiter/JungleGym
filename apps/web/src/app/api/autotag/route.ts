import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fetchGhostTags } from '@/lib/ghostTags'
import { suggestTagsFromTitle } from '@/lib/movementTags'
import { rateLimit } from '@/lib/rateLimit'

/**
 * POST /api/autotag
 * Generates ghost tags from title + description + creator's own public tags.
 * Used by VideoEditForm after save to update ghost_tags on an existing video.
 * Falls back to keyword matching if GROQ_API_KEY is not set or Groq is unreachable.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Cap per-user spam against paid Groq API. 30 calls / 10 min is plenty
  // for real editing while curbing a runaway client.
  const rl = rateLimit(`autotag:${user.id}`, 30, 10 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 500) : ''
  const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 2000) : ''
  const userTags: string[] = Array.isArray(body?.userTags) ? body.userTags : []

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ tags: suggestTagsFromTitle(title + ' ' + description), source: 'keyword' })
  }

  try {
    const tags = await fetchGhostTags(title, description, userTags)
    return NextResponse.json({ tags, source: 'llm' })
  } catch {
    return NextResponse.json({ tags: suggestTagsFromTitle(title + ' ' + description), source: 'keyword' })
  }
}
