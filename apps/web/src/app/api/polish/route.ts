import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { polishText } from '@/lib/polishText'

/**
 * POST /api/polish
 * Body: { kind: 'bio' | 'description', current: string, context?: Record<string, unknown> }
 * Returns: { suggestion: string } or { error }
 *
 * The creator must review + accept the suggestion before it becomes public.
 * The server never silently replaces user text.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const kind = body?.kind
  if (kind !== 'bio' && kind !== 'description') {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
  }

  const current = typeof body?.current === 'string' ? body.current.trim().slice(0, 2000) : ''
  const rawContext = (body?.context ?? {}) as Record<string, unknown>

  // Sanitize context to strings / string arrays only
  const context: Record<string, string | string[]> = {}
  for (const [k, v] of Object.entries(rawContext)) {
    if (typeof v === 'string' && v.trim()) context[k] = v.trim().slice(0, 500)
    else if (Array.isArray(v)) {
      const arr = v.filter((x) => typeof x === 'string' && x.trim()).map((x: string) => x.trim())
      if (arr.length > 0) context[k] = arr.slice(0, 20)
    }
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'AI polish is not configured' }, { status: 503 })
  }

  const suggestion = await polishText({ kind, current, context })
  if (!suggestion) {
    return NextResponse.json({ error: 'Could not generate a suggestion — try again in a moment.' }, { status: 502 })
  }

  return NextResponse.json({ suggestion })
}
