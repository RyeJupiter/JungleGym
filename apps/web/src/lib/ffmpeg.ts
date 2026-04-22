// Shared ffmpeg.wasm loader.
//
// ffmpeg-core.wasm is ~32MB, which exceeds Cloudflare Workers' 25MB static-
// asset cap. We fetch it from unpkg at runtime; toBlobURL wraps it locally
// so the browser only hits the CDN once per session.
// CSP needs `connect-src https://unpkg.com` for the fetch.

const FFMPEG_LOAD_TIMEOUT_MS = 120_000
const FFMPEG_CORE_VERSION = '0.12.10'
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`

export type FFmpegLoadProgress = { stage: 'loading-ffmpeg'; ratio: number | null }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ffmpegInstance: any = null
let ffmpegLoading: Promise<unknown> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getFFmpeg(onProgress?: (p: FFmpegLoadProgress) => void): Promise<any> {
  if (ffmpegInstance) return ffmpegInstance

  if (!ffmpegLoading) {
    ffmpegLoading = (async () => {
      onProgress?.({ stage: 'loading-ffmpeg', ratio: 0 })
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { toBlobURL } = await import('@ffmpeg/util')
      const ff = new FFmpeg()
      // Only wrap the core files — the library's own worker.js (with its
      // relative imports of const.js/classes.js/etc.) must be bundled by
      // Next.js via `new URL('./worker.js', import.meta.url)`, not a
      // blob: URL, because relative ES-module imports can't resolve
      // against blob: URLs. Passing classWorkerURL here caused a hang
      // during ffmpeg.load() in the past.
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
        toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
      ])
      await withTimeout(
        ff.load({ coreURL, wasmURL }),
        FFMPEG_LOAD_TIMEOUT_MS,
        'ffmpeg.load() timed out',
      )
      ffmpegInstance = ff
      return ff
    })().catch((err) => {
      // Clear the cached loading promise so a later attempt can retry
      // instead of being stuck on a rejected promise forever.
      ffmpegLoading = null
      throw err
    })
  }

  await ffmpegLoading
  return ffmpegInstance
}

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    p.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}
