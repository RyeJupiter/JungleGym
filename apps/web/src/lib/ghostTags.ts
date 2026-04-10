import { MOVEMENT_TAGS } from './movementTags'

const GROQ_TIMEOUT_MS = 5000

/**
 * Call Groq to generate internal ghost tags for a video.
 * Ghost tags are never shown publicly — they expand search/discovery coverage.
 * Returns an empty array if GROQ_API_KEY is not set or the call fails.
 */
export async function fetchGhostTags(
  title: string,
  description: string,
  userTags: string[],
  timeoutMs = GROQ_TIMEOUT_MS,
): Promise<string[]> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return []

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const tagList = MOVEMENT_TAGS.join(', ')
    const userTagLine = userTags.length
      ? `The creator has already chosen these public tags: ${userTags.join(', ')}. Do NOT repeat them — generate complementary tags that expand searchability.\n\n`
      : ''

    const prompt = `You are a tag classifier for a movement and teaching video platform called JungleGym — yoga, dance, martial arts, breathwork, strength, and beyond. Your job is to generate internal search tags ("ghost tags") for a video — these are never shown publicly but help learners discover the right content.

${userTagLine}Recommended tags (use these when they fit — they keep tags consistent across the platform): ${tagList}

You may also create short, lowercase, hyphenated tags not on this list if the content clearly calls for it. Prioritize specificity and searchability. Return ONLY a JSON array of tag strings, nothing else.

Video title: ${title}
${description ? `Description: ${description}` : ''}

Return 5-15 ghost tags as a JSON array.`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      }),
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`Groq ${res.status}`)

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim() ?? '[]'
    const jsonMatch = content.match(/\[[\s\S]*?\]/)
    if (!jsonMatch) return []

    const raw: string[] = JSON.parse(jsonMatch[0])
    return raw
      .map((t) => t.toLowerCase().trim().replace(/\s+/g, '-'))
      .filter((t) => /^[a-z0-9-]{2,40}$/.test(t))
  } finally {
    clearTimeout(timer)
  }
}
