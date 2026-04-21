import { MOVEMENT_TAGS } from './movementTags'

const GROQ_TIMEOUT_MS = 5000
const TRANSCRIPT_GROQ_TIMEOUT_MS = 20000
const MAX_TRANSCRIPT_CHARS = 12000

/**
 * Call Groq to generate internal ghost tags for a video.
 * Ghost tags are never shown publicly — they power the internal recommendation
 * algorithm and expand search coverage when a creator titles a video vaguely.
 *
 * Falls back to title+description only if no transcript is available yet.
 * Returns an empty array if GROQ_API_KEY is not set or the call fails.
 */
export async function fetchGhostTags(
  title: string,
  description: string,
  userTags: string[],
  transcript?: string | null,
  timeoutMs?: number,
): Promise<string[]> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return []

  const hasTranscript = !!transcript && transcript.trim().length > 50
  const effectiveTimeout = timeoutMs ?? (hasTranscript ? TRANSCRIPT_GROQ_TIMEOUT_MS : GROQ_TIMEOUT_MS)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), effectiveTimeout)

  try {
    const tagList = MOVEMENT_TAGS.join(', ')
    const userTagLine = userTags.length
      ? `The creator chose these public tags: ${userTags.join(', ')}. Treat these as hints — your tags should complement, not duplicate, them.\n\n`
      : ''

    // Keep the prompt under Groq's context window. 12k chars is roughly
    // 3k tokens — plenty of headroom on llama-3.1-8b-instant (128k window).
    const transcriptBlock = hasTranscript
      ? `\nTranscript (primary signal — this is what actually happens in the video):\n"""\n${transcript!.slice(0, MAX_TRANSCRIPT_CHARS)}\n"""\n`
      : ''

    const prompt = `You generate internal ghost tags for videos on JungleGym, a platform for movement teachers (yoga, dance, martial arts, breathwork, strength, mobility, meditation, and related practices).

PURPOSE OF THESE TAGS
These tags are never shown to users. They feed an internal recommendation algorithm that matches learners with videos they'll love. Accuracy matters more than coverage — a wrong tag sends someone to the wrong video.

WHAT TO CAPTURE
Produce 6–15 tags that collectively describe:
  • Movement style / discipline (e.g. vinyasa-yoga, hip-hop-choreography, muay-thai, qigong, kettlebell)
  • Body focus (hips, shoulders, core, full-body, spine, feet, hamstrings)
  • Intensity (gentle, moderate, vigorous, restorative)
  • Skill level (beginner, intermediate, advanced)
  • Session type (flow, tutorial, technique-drill, freestyle, guided-meditation, warmup)
  • Mood / energy (grounding, energizing, playful, meditative, cathartic)
  • Equipment (bodyweight, mat-only, blocks, resistance-band, kettlebell, weights)

${userTagLine}Prefer tags from this vocabulary when they fit (keeps tagging consistent across the platform): ${tagList}

You may invent additional lowercase hyphenated tags when the content clearly calls for something not in the list. Do NOT invent facts the source material doesn't support.
${hasTranscript ? 'The transcript is your primary signal — the title may be vague or cute, the transcript tells you what actually happens.' : 'Base tags only on what the title and description imply — do not speculate wildly.'}

OUTPUT FORMAT
Return ONLY a JSON array of lowercase hyphenated strings. No prose, no explanation.

Video title: ${title}
${description ? `Description: ${description}` : ''}${transcriptBlock}
Return 6–15 ghost tags as a JSON array.`

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
        max_tokens: 400,
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
