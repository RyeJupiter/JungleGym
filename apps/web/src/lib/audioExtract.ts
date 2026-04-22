// In-browser audio extraction for transcription.
//
// Uses ffmpeg.wasm (lazily loaded via lib/ffmpeg.ts) to demux audio from the
// uploaded video, resample to 16kHz mono, and encode to 48kbps Opus in a
// WebM container. Output is chunked into 15-minute segments so each chunk
// fits comfortably under Groq's 25MB per-file limit (15min × 48kbps ≈ 5MB).

import { getFFmpeg } from './ffmpeg'

const CHUNK_SECONDS = 900 // 15 minutes
const AUDIO_BITRATE_KBPS = 48

export type AudioChunk = {
  /** Zero-indexed chunk number; matches filename and time offset in transcript. */
  index: number
  /** WebM/Opus audio blob. */
  blob: Blob
  /** Start time of this chunk within the full video, in seconds. */
  startSeconds: number
}

export type ExtractProgress = {
  stage: 'loading-ffmpeg' | 'extracting' | 'chunking' | 'done'
  /** 0–1, or null when indeterminate. */
  ratio: number | null
}

/**
 * Extract audio from a video file and return one or more chunks ready for
 * upload to the transcripts bucket.
 *
 * Throws on failure — callers should catch and fall through to uploading
 * the video without transcription (the admin Issues panel will surface it).
 */
export async function extractAudioChunks(
  videoFile: File,
  onProgress?: (p: ExtractProgress) => void,
): Promise<AudioChunk[]> {
  const ff = await getFFmpeg(onProgress)
  onProgress?.({ stage: 'extracting', ratio: null })

  const { fetchFile } = await import('@ffmpeg/util')
  const inputName = 'input' + (videoFile.name.match(/\.[a-z0-9]+$/i)?.[0] ?? '.mp4')
  const outputPattern = 'out_%03d.webm'

  // ffmpeg.wasm progress events give us a 0–1 ratio during the encode.
  // Hook it up so the UI can show a live bar.
  const progressHandler = ({ progress }: { progress: number }) => {
    if (Number.isFinite(progress) && progress >= 0) {
      onProgress?.({ stage: 'extracting', ratio: Math.min(progress, 1) })
    }
  }
  ff.on('progress', progressHandler)

  try {
    await ff.writeFile(inputName, await fetchFile(videoFile))

    // -vn: drop video stream (audio-only — ~10x faster than re-encoding video)
    // -ac 1: downmix to mono (fine for speech, halves file size)
    // -ar 16000: Whisper's native sample rate — no benefit going higher
    // -c:a libopus + -b:a: Opus gives excellent speech quality at low bitrate
    // -f segment + -segment_time: emit one file per 15-minute chunk
    const exitCode = await ff.exec([
      '-i', inputName,
      '-vn',
      '-ac', '1',
      '-ar', '16000',
      '-c:a', 'libopus',
      '-b:a', `${AUDIO_BITRATE_KBPS}k`,
      '-f', 'segment',
      '-segment_time', String(CHUNK_SECONDS),
      '-reset_timestamps', '1',
      outputPattern,
    ])

    if (exitCode !== 0) {
      throw new Error(`ffmpeg exited with code ${exitCode}`)
    }

    onProgress?.({ stage: 'chunking', ratio: null })

    // Enumerate produced segment files. ffmpeg starts at 000 and
    // increments until the stream ends; we stop on first missing index.
    const chunks: AudioChunk[] = []
    for (let i = 0; i < 999; i++) {
      const name = `out_${String(i).padStart(3, '0')}.webm`
      try {
        const data = (await ff.readFile(name)) as Uint8Array
        if (!data || data.byteLength === 0) break
        // Copy into a fresh buffer — the ffmpeg FS owns the original
        // memory and reusing it after deleteFile could read garbage.
        const buffer = new ArrayBuffer(data.byteLength)
        new Uint8Array(buffer).set(data)
        chunks.push({
          index: i,
          blob: new Blob([buffer], { type: 'audio/webm' }),
          startSeconds: i * CHUNK_SECONDS,
        })
        await ff.deleteFile(name).catch(() => {})
      } catch {
        break
      }
    }

    if (chunks.length === 0) throw new Error('ffmpeg produced no audio chunks')

    await ff.deleteFile(inputName).catch(() => {})
    onProgress?.({ stage: 'done', ratio: 1 })
    return chunks
  } finally {
    ff.off('progress', progressHandler)
  }
}
