// In-browser video transcode to MP4.
//
// iPhones record .MOV (video/quicktime) and modern 4K HEVC clips often blow
// past the 100MB intro-videos bucket cap. This helper uses ffmpeg.wasm to
// re-encode the user's file to H.264/AAC MP4 at 720p max — broad playback
// compatibility and a size that fits the bucket even for multi-minute clips.

import { getFFmpeg, type FFmpegLoadProgress } from './ffmpeg'

export type TranscodeProgress =
  | FFmpegLoadProgress
  | { stage: 'transcoding'; ratio: number | null }
  | { stage: 'done'; ratio: 1 }

const BUCKET_MAX_BYTES = 100 * 1024 * 1024
const PASSTHROUGH_MIMES = new Set(['video/mp4', 'video/webm'])

/**
 * Transcode any browser-selectable video to a web-friendly MP4.
 *
 * Fast path: if the input is already MP4 or WebM and under the bucket cap,
 * return it unchanged — no sense re-encoding an already-compliant file.
 *
 * Otherwise: scale to 720p max (preserves aspect), H.264 veryfast/CRF 26
 * for a balance of quality and in-browser encode time, AAC 128kbps audio,
 * +faststart so the moov atom sits at the front for instant seek.
 */
export async function transcodeToMp4(
  file: File,
  onProgress?: (p: TranscodeProgress) => void,
): Promise<File> {
  if (PASSTHROUGH_MIMES.has(file.type) && file.size <= BUCKET_MAX_BYTES) {
    return file
  }

  const ff = await getFFmpeg(onProgress)
  const { fetchFile } = await import('@ffmpeg/util')

  const inputExt = file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? '.mov'
  const inputName = `input${inputExt}`
  const outputName = 'out.mp4'

  onProgress?.({ stage: 'transcoding', ratio: null })

  const progressHandler = ({ progress }: { progress: number }) => {
    if (Number.isFinite(progress) && progress >= 0) {
      onProgress?.({ stage: 'transcoding', ratio: Math.min(progress, 1) })
    }
  }
  ff.on('progress', progressHandler)

  try {
    await ff.writeFile(inputName, await fetchFile(file))

    // scale='min(1280,iw)':-2 → cap width at 1280, preserve aspect, ensure
    // the derived height is divisible by 2 (x264 requirement).
    const exitCode = await ff.exec([
      '-i', inputName,
      '-vf', "scale='min(1280,iw)':-2",
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '26',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputName,
    ])

    if (exitCode !== 0) throw new Error(`ffmpeg exited with code ${exitCode}`)

    const data = (await ff.readFile(outputName)) as Uint8Array
    // Copy into a fresh buffer — the ffmpeg FS owns the original memory
    // and reusing it after deleteFile could read garbage.
    const buffer = new ArrayBuffer(data.byteLength)
    new Uint8Array(buffer).set(data)

    const baseName = file.name.replace(/\.[^.]+$/, '')
    const out = new File([buffer], `${baseName}.mp4`, {
      type: 'video/mp4',
      lastModified: Date.now(),
    })

    await ff.deleteFile(inputName).catch(() => {})
    await ff.deleteFile(outputName).catch(() => {})
    onProgress?.({ stage: 'done', ratio: 1 })
    return out
  } finally {
    ff.off('progress', progressHandler)
  }
}
