/**
 * Returns true if the file is HEIC/HEIF — a format most browsers can't decode natively.
 * Checks both the MIME type and the file extension since macOS sometimes
 * reports these files with a generic or empty type.
 */
export function isHeicFile(file: File): boolean {
  const heicTypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']
  if (heicTypes.includes(file.type.toLowerCase())) return true
  const ext = file.name.split('.').pop()?.toLowerCase()
  return ext === 'heic' || ext === 'heif'
}

/**
 * Converts a HEIC/HEIF file to JPEG using heic2any (loaded on demand via
 * dynamic import — zero bundle cost unless a HEIC file is actually selected).
 * Returns the file unchanged if it is not HEIC.
 */
export async function convertHeicIfNeeded(file: File): Promise<File> {
  if (!isHeicFile(file)) return file

  // Dynamic import: only fetches the ~1.5 MB WASM bundle when needed
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 1 })
  const blob = Array.isArray(result) ? result[0] : result
  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
}

type CompressOptions = {
  /** Maximum width in pixels — image is scaled down proportionally if wider */
  maxWidth: number
  /** Maximum height in pixels — image is scaled down proportionally if taller */
  maxHeight: number
  /** Fixed JPEG quality 0–1. Ignored when maxBytes is set. */
  quality?: number
  /**
   * Target maximum output size in bytes. When set, binary-searches for the
   * highest JPEG quality that produces a file at or under this limit.
   * quality is ignored when maxBytes is provided.
   */
  maxBytes?: number
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load failed')) }
    img.src = url
  })
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

/**
 * Resize + recompress an image file using the browser Canvas API.
 * Always outputs JPEG.
 *
 * When maxBytes is set, binary-searches for the highest JPEG quality that
 * keeps the output at or under the limit — giving the best possible quality
 * within the constraint rather than a fixed quality guess.
 *
 * Falls back to the original file if anything goes wrong.
 */
export async function compressImage(file: File, opts: CompressOptions): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  let img: HTMLImageElement
  try { img = await loadImage(file) } catch { return file }

  // Scale down proportionally if over the limit, never upscale
  let { naturalWidth: width, naturalHeight: height } = img
  if (width > opts.maxWidth || height > opts.maxHeight) {
    const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file

  // White background before drawing (handles transparent PNGs → JPEG)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  let blob: Blob | null

  if (opts.maxBytes) {
    // Binary search: highest quality whose output fits within maxBytes.
    // 8 iterations → quality precision of ~0.003, which is imperceptible.
    let lo = 0.60, hi = 0.97, best: Blob | null = null
    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2
      const candidate = await toBlob(canvas, mid)
      if (candidate && candidate.size <= opts.maxBytes) {
        best = candidate
        lo = mid   // fits — try higher quality
      } else {
        hi = mid   // too big — try lower quality
      }
    }
    // Fallback: minimum acceptable quality if nothing fit (shouldn't happen at 5 MB)
    blob = best ?? await toBlob(canvas, 0.60)
  } else {
    const q = opts.quality ?? 0.82
    blob = await toBlob(canvas, q)
    // If the compressed result is somehow larger, keep the original
    if (blob && blob.size >= file.size) return file
  }

  if (!blob) return file

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
}
