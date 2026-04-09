import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { MOVEMENT_TAGS } from '@/lib/movementTags'

/**
 * POST /api/autotag
 * Uses an LLM (Groq) to suggest tags for a video based on title + description.
 * Falls back to keyword matching if GROQ_API_KEY is not set.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 500) : ''
  const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 2000) : ''

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) {
    // Fallback: keyword matching (same as client-side)
    const { suggestTagsFromTitle } = await import('@/lib/movementTags')
    const tags = suggestTagsFromTitle(title + ' ' + (description ?? ''))
    return NextResponse.json({ tags, source: 'keyword' })
  }

  // Use Groq API with a lightweight model
  const tagList = MOVEMENT_TAGS.join(', ')
  const prompt = `You are a tag classifier for a movement/fitness video platform. Given a video title and optional description, select the most relevant tags from the allowed list below. Return ONLY a JSON array of tag strings, nothing else.

Allowed tags: ${tagList}

Video title: ${title}
${description ? `Description: ${description}` : ''}

Return 3-8 tags as a JSON array.`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma2-9b-it',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Groq API error:', err)
      // Fallback
      const { suggestTagsFromTitle } = await import('@/lib/movementTags')
      return NextResponse.json({ tags: suggestTagsFromTitle(title), source: 'keyword' })
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim() ?? '[]'

    // Parse the JSON array from the response
    const jsonMatch = content.match(/\[[\s\S]*?\]/)
    if (!jsonMatch) {
      const { suggestTagsFromTitle } = await import('@/lib/movementTags')
      return NextResponse.json({ tags: suggestTagsFromTitle(title), source: 'keyword' })
    }

    const rawTags: string[] = JSON.parse(jsonMatch[0])
    // Filter to only valid tags from our vocabulary
    const validTags = rawTags
      .map((t) => t.toLowerCase().trim())
      .filter((t) => MOVEMENT_TAGS.includes(t))

    return NextResponse.json({ tags: validTags, source: 'llm' })
  } catch (err) {
    console.error('Autotag error:', err)
    const { suggestTagsFromTitle } = await import('@/lib/movementTags')
    return NextResponse.json({ tags: suggestTagsFromTitle(title), source: 'keyword' })
  }
}
