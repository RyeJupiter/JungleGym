// Groq Whisper transcription helpers.
// Kept separate from the route so the retry path (admin Issues panel)
// can re-use the same logic.

type GroqSegment = {
  id: number
  start: number
  end: number
  text: string
}

export type GroqTranscription = {
  text: string
  segments: GroqSegment[]
}

/** Call Groq's Whisper endpoint for a single audio chunk. */
export async function transcribeChunk(audio: Blob, apiKey: string): Promise<GroqTranscription> {
  const form = new FormData()
  form.append('file', audio, 'chunk.webm')
  form.append('model', 'whisper-large-v3-turbo')
  form.append('response_format', 'verbose_json')
  // English-only for now. Whisper auto-detects, but forcing 'en' avoids
  // occasional misdetection on short silent intros.
  form.append('language', 'en')

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Groq Whisper ${res.status}: ${body.slice(0, 200)}`)
  }

  return (await res.json()) as GroqTranscription
}

/**
 * Merge multiple chunk transcriptions into a single segment list with
 * absolute timestamps. Each chunk's local timestamps are offset by the
 * chunk's position in the source audio (index * chunk_seconds).
 */
export function mergeTranscriptions(
  chunks: Array<{ startSeconds: number; transcription: GroqTranscription }>,
): GroqTranscription {
  const merged: GroqSegment[] = []
  const textParts: string[] = []
  let idCursor = 0

  for (const { startSeconds, transcription } of chunks) {
    textParts.push(transcription.text.trim())
    for (const seg of transcription.segments ?? []) {
      merged.push({
        id: idCursor++,
        start: seg.start + startSeconds,
        end: seg.end + startSeconds,
        text: seg.text,
      })
    }
  }

  return {
    text: textParts.join(' ').trim(),
    segments: merged,
  }
}

/** Format seconds as WebVTT timestamp: HH:MM:SS.mmm */
function formatVttTime(seconds: number): string {
  const totalMs = Math.max(0, Math.round(seconds * 1000))
  const ms = totalMs % 1000
  const totalS = Math.floor(totalMs / 1000)
  const s = totalS % 60
  const totalM = Math.floor(totalS / 60)
  const m = totalM % 60
  const h = Math.floor(totalM / 60)
  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`
}

/** Serialize merged segments as WebVTT for <track kind="captions">. */
export function toWebVTT(transcription: GroqTranscription): string {
  const lines = ['WEBVTT', '']
  for (const seg of transcription.segments) {
    // Skip empty / whitespace-only cues — they'd render as flickering blanks.
    const text = seg.text.trim()
    if (!text) continue
    lines.push(`${formatVttTime(seg.start)} --> ${formatVttTime(seg.end)}`)
    lines.push(text)
    lines.push('')
  }
  return lines.join('\n')
}
