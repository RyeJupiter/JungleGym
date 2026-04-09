'use client'

import { useRef, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { compressImage, isHeicFile } from '@/lib/compressImage'
import type { ThemeClasses } from '../themes'

export type GalleryImage = { url: string; caption?: string }

type Props = {
  images: GalleryImage[]
  theme: ThemeClasses
  editing?: boolean
  userId?: string
  onImagesChange?: (images: GalleryImage[]) => void
}

export function PhotoGallerySection({
  images,
  theme,
  editing = false,
  userId,
  onImagesChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleUpload(files: FileList) {
    if (!userId) return
    const supabase = createBrowserSupabaseClient()
    const newImages: GalleryImage[] = [...images]

    const heicFiles = Array.from(files).filter(isHeicFile)
    if (heicFiles.length > 0) {
      setUploadError(`${heicFiles.length === 1 ? 'One photo is' : `${heicFiles.length} photos are`} in HEIC format, which browsers can't display. Export as JPEG from Photos (iPhone) or Preview (Mac) and try again.`)
    }

    for (const file of Array.from(files)) {
      if (isHeicFile(file)) continue
      const ready = await compressImage(file, { maxWidth: 2400, maxHeight: 2400, quality: 0.88 })
      const ext = ready.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${crypto.randomUUID()}.${ext}`

      const { error } = await supabase.storage
        .from('gallery-images')
        .upload(path, ready, { cacheControl: '3600', upsert: false })

      if (error) {
        alert('Upload failed: ' + error.message)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('gallery-images')
        .getPublicUrl(path)

      newImages.push({ url: publicUrl })
    }

    onImagesChange?.(newImages)
  }

  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index)
    onImagesChange?.(next)
  }

  // View mode — horizontal scroll carousel
  if (!editing) {
    if (images.length === 0) return null
    return (
      <section className="mb-12">
        <h2 className={`text-xl font-black ${theme.textPrimary} mb-5 px-6 max-w-5xl mx-auto`}>Gallery</h2>
        <div className="flex gap-3 overflow-x-auto px-6 pb-3 snap-x snap-mandatory scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {images.map((img, i) => (
            <div
              key={i}
              className={`flex-shrink-0 w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border ${theme.cardBorder} snap-start`}
            >
              <img src={img.url} alt={img.caption ?? ''} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  // Edit mode
  return (
    <section className="mb-12">
      <h2 className={`text-xl font-black ${theme.textPrimary} mb-5`}>Gallery</h2>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          setUploadError(null)
          if (e.target.files?.length) handleUpload(e.target.files)
        }}
      />

      {uploadError && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <span className="flex-1">{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600 font-bold flex-shrink-0">✕</button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img, i) => (
          <div key={i} className={`aspect-square rounded-xl overflow-hidden border ${theme.cardBorder} relative group`}>
            <img src={img.url} alt={img.caption ?? ''} className="w-full h-full object-cover" />
            <button
              onClick={() => removeImage(i)}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-xs w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ))}

        {/* Add photo button */}
        <button
          onClick={() => fileRef.current?.click()}
          className={`aspect-square rounded-xl border-2 border-dashed ${theme.cardBorder} ${theme.textMuted} flex flex-col items-center justify-center gap-1 hover:${theme.cardHoverBorder} transition-colors`}
        >
          <span className="text-2xl">+</span>
          <span className="text-xs font-medium">Add photos</span>
        </button>
      </div>
    </section>
  )
}
