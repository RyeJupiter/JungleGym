type CompressOptions = {
  /** Maximum width in pixels — image is scaled down proportionally if wider */
  maxWidth: number
  /** Maximum height in pixels — image is scaled down proportionally if taller */
  maxHeight: number
  /** JPEG quality 0–1. 0.82 is a good default for avatars, 0.88 for gallery */
  quality: number
}

/**
 * Resize + recompress an image file using the browser Canvas API.
 * Always outputs JPEG. Falls back to the original file if anything goes wrong.
 */
export async function compressImage(file: File, opts: CompressOptions): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // Scale down proportionally if over the limit, never upscale
      let { width, height } = img
      if (width > opts.maxWidth || height > opts.maxHeight) {
        const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }

      // Fill white background before drawing (handles transparent PNGs → JPEG)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          // If the compressed result is somehow larger, keep the original
          if (blob.size >= file.size) { resolve(file); return }
          const baseName = file.name.replace(/\.[^.]+$/, '')
          resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }))
        },
        'image/jpeg',
        opts.quality,
      )
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}
