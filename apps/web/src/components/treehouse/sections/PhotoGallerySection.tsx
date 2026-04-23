'use client'

import { useRef, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { compressImage, convertHeicIfNeeded } from '@/lib/compressImage'
import type { ThemeClasses } from '../themes'

export type GalleryImage = { url: string; caption?: string }

type Props = {
  images: GalleryImage[]
  theme: ThemeClasses
  editing?: boolean
  userId?: string
  /** Max images allowed. Omit for unlimited (creators). */
  maxImages?: number
  onImagesChange?: (images: GalleryImage[]) => void
}

export function PhotoGallerySection({
  images,
  theme,
  editing = false,
  userId,
  maxImages,
  onImagesChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [converting, setConverting] = useState(false)

  const atCap = maxImages != null && images.length >= maxImages
  const remainingSlots = maxImages != null
    ? Math.max(0, maxImages - images.length)
    : Infinity

  async function handleUpload(files: FileList) {
    if (!userId) return
    const supabase = createBrowserSupabaseClient()
    const newImages: GalleryImage[] = [...images]

    // Cap how many of the picked files we actually process — prevents a
    // learner from multi-selecting past their limit.
    const picked = Array.from(files).slice(0, remainingSlots)
    if (picked.length === 0) return

    setConverting(true)
    for (const file of picked) {
      const converted = await convertHeicIfNeeded(file)
      const ready = await compressImage(converted, { maxWidth: 2400, maxHeight: 2400, quality: 0.88 })
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

    setConverting(false)
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
          if (e.target.files?.length) handleUpload(e.target.files)
        }}
      />

      {converting && (
        <div className="mb-4 flex items-center gap-2 text-stone-500 text-sm px-1">
          <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Converting &amp; uploading photos…
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

        {/* Add photo button — hidden at cap so the slot doesn't linger as a
            dangling empty tile. */}
        {!atCap && (
          <button
            onClick={() => fileRef.current?.click()}
            className={`aspect-square rounded-xl border-2 border-dashed ${theme.cardBorder} ${theme.textMuted} flex flex-col items-center justify-center gap-1 hover:${theme.cardHoverBorder} transition-colors`}
          >
            <span className="text-2xl">+</span>
            <span className="text-xs font-medium">Add photos</span>
          </button>
        )}
      </div>

      {maxImages != null && (
        <p className={`${theme.textMuted} text-xs mt-3`}>
          {atCap
            ? `Gallery full (${images.length}/${maxImages}). Remove a photo to add more, or become a creator for a bigger gallery.`
            : `${images.length}/${maxImages} photos used.`}
        </p>
      )}
    </section>
  )
}
