const GROQ_TIMEOUT_MS = 8000

type PolishKind = 'bio' | 'description'

type PolishInput = {
  kind: PolishKind
  current: string
  context: Record<string, string | number | string[] | null | undefined>
}

/**
 * Call Groq to expand/polish short user-written copy into fuller, SEO-friendly text.
 * The result is a SUGGESTION only — the creator must review and accept/edit it
 * before it becomes the public-facing copy. We never replace user text silently.
 * Returns null if GROQ_API_KEY is not set or the call fails.
 */
export async function polishText(
  { kind, current, context }: PolishInput,
  timeoutMs = GROQ_TIMEOUT_MS,
): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const contextLines = Object.entries(context)
      .filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0))
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\n')

    const targetLen = kind === 'bio' ? '4-6 sentences (~400-600 chars)' : '3-5 sentences (~300-500 chars)'
    const voiceGuide =
      kind === 'bio'
        ? 'Write in first person ("I"), warm and grounded. Don\'t oversell — name the practice, who it\'s for, and what people can expect. No corporate hype, no emojis, no hashtags.'
        : 'Write in a descriptive, inviting voice (second person "you" works). Name what the class covers, what level it suits, and what body parts / intentions it emphasizes. No emojis, no hashtags, no sales language.'

    const prompt = `You are a copy editor helping a movement teacher on JungleGym — a platform for yoga, dance, martial arts, breathwork, strength, and other body practices. You're expanding a short draft into ${kind === 'bio' ? 'a richer creator bio' : 'a richer class description'} so learners and search engines can find it.

${contextLines ? `Context:\n${contextLines}\n\n` : ''}Current draft (may be very short or empty):
"""
${current || '(empty)'}
"""

Write a polished ${kind} that's ${targetLen}. ${voiceGuide}

IMPORTANT:
- Stay true to what the creator has already written — expand, don't invent new credentials, cities, or claims.
- Use language a real human would use. No jargon, no SEO stuffing.
- Do not use headings, bullet lists, quotation marks, or markdown. Return plain prose only.
- Return ONLY the polished ${kind} text, nothing else — no preamble, no "Here is...", no explanations.`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 500,
      }),
      signal: controller.signal,
    })

    if (!res.ok) return null

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim() ?? ''
    if (!content) return null

    // Strip any accidental wrapping quotes or "Here is..." preamble
    const cleaned = content
      .replace(/^(here(?:'s| is)[^:]*:\s*)/i, '')
      .replace(/^["']|["']$/g, '')
      .trim()

    return cleaned || null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
