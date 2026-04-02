'use client'

import { useRef } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { ThemeClasses } from '../themes'

type Props = {
  videoUrl?: string
  theme: ThemeClasses
  editing?: boolean
  userId?: string
  onVideoUploaded?: (url: string) => void
  onVideoRemoved?: () => void
}

export function IntroVideoSection({
  videoUrl,
  theme,
  editing = false,
  userId,
  onVideoUploaded,
  onVideoRemoved,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    if (!userId) return
    const supabase = createBrowserSupabaseClient()
    const ext = file.name.split('.').pop() ?? 'mp4'
    const path = `${userId}/${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage
      .from('intro-videos')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (error) {
      alert('Upload failed: ' + error.message)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('intro-videos')
      .getPublicUrl(path)

    onVideoUploaded?.(publicUrl)
  }

  // View mode — just show the video
  if (!editing) {
    if (!videoUrl) return null
    return (
      <section className="mb-12">
        <video
          src={videoUrl}
          controls
          playsInline
          className={`w-full rounded-xl border ${theme.cardBorder} max-h-[480px] bg-black`}
        />
      </section>
    )
  }

  // Edit mode
  return (
    <section className="mb-12">
      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/webm"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
      />

      {videoUrl ? (
        <div className="relative">
          <video
            src={videoUrl}
            controls
            playsInline
            className={`w-full rounded-xl border ${theme.cardBorder} max-h-[480px] bg-black`}
          />
          <button
            onClick={() => onVideoRemoved?.()}
            className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition-colors"
          >
            Remove video
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className={`w-full rounded-xl border-2 border-dashed ${theme.cardBorder} ${theme.textMuted} py-16 text-center hover:${theme.cardHoverBorder} transition-colors`}
        >
          <span className="text-4xl block mb-2">🎥</span>
          <span className="text-sm font-semibold">Click to upload an intro video</span>
          <span className="text-xs block mt-1">MP4 or WebM, up to 100 MB</span>
        </button>
      )}
    </section>
  )
}
