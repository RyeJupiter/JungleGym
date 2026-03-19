'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { calculateTierPrices, formatPrice } from '@junglegym/shared'

export function VideoUploadForm({
  creatorId,
  defaultRates,
}: {
  creatorId: string
  defaultRates: { supported: number; community: number; abundance: number }
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [isFree, setIsFree] = useState(false)
  const [durationSecs, setDurationSecs] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const duration = parseInt(durationSecs) || 0
  const prices = duration > 0 ? calculateTierPrices(duration, defaultRates) : null

  function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    const el = document.createElement('video')
    el.preload = 'metadata'
    el.onloadedmetadata = () => {
      setDurationSecs(Math.round(el.duration).toString())
      URL.revokeObjectURL(url)
    }
    el.src = url
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isFree && !prices) {
      setError('Enter a duration or upload a file to calculate pricing.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const videoId = crypto.randomUUID()
      let videoStoragePath: string | null = null
      let thumbnailPublicUrl: string | null = null

      if (videoFile) {
        setProgress('Uploading video…')
        const ext = videoFile.name.split('.').pop()
        const path = `${creatorId}/${videoId}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(path, videoFile, { cacheControl: '3600' })
        if (uploadError) throw uploadError
        videoStoragePath = path
      }

      if (thumbnailFile) {
        setProgress('Uploading thumbnail…')
        const ext = thumbnailFile.name.split('.').pop()
        const path = `${creatorId}/${videoId}.${ext}`
        const { error: thumbError } = await supabase.storage
          .from('thumbnails')
          .upload(path, thumbnailFile, { cacheControl: '3600' })
        if (thumbError) throw thumbError
        const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(path)
        thumbnailPublicUrl = publicUrl
      }

      setProgress('Saving…')
      const { error: insertError } = await supabase.from('videos').insert({
        id: videoId,
        creator_id: creatorId,
        title,
        description: description || null,
        tags: tags ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
        duration_seconds: duration || null,
        is_free: isFree,
        price_supported: (!isFree && prices) ? prices.supported : null,
        price_community: (!isFree && prices) ? prices.community : null,
        price_abundance: (!isFree && prices) ? prices.abundance : null,
        video_url: videoStoragePath,
        thumbnail_url: thumbnailPublicUrl,
        published: false,
      })
      if (insertError) throw insertError

      router.push('/studio')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
      {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Video file</label>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleVideoFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          className="w-full border-2 border-dashed border-stone-200 hover:border-jungle-400 rounded-xl py-8 text-sm text-stone-400 hover:text-jungle-600 transition-colors"
        >
          {videoFile
            ? <span className="text-stone-700 font-medium">{videoFile.name}</span>
            : 'Click to select video (MP4, WebM, MOV · up to 5 GB)'}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Thumbnail <span className="text-stone-400 font-normal">(optional)</span>
        </label>
        <input
          ref={thumbInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => thumbInputRef.current?.click()}
          className="w-full border-2 border-dashed border-stone-200 hover:border-jungle-400 rounded-xl py-4 text-sm text-stone-400 hover:text-jungle-600 transition-colors"
        >
          {thumbnailFile
            ? <span className="text-stone-700 font-medium">{thumbnailFile.name}</span>
            : 'Click to select thumbnail image'}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          required className={inputClass} placeholder="Kettlebell Swing Masterclass"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          rows={3} className={inputClass}
          placeholder="What will learners take away? What seed are you planting?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Tags</label>
        <input
          type="text" value={tags} onChange={(e) => setTags(e.target.value)}
          className={inputClass} placeholder="strength, kettlebell, beginner"
        />
        <p className="text-xs text-stone-400 mt-1">Comma-separated</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Duration (seconds)</label>
        <input
          type="number" value={durationSecs} onChange={(e) => setDurationSecs(e.target.value)}
          min="1" className={inputClass} placeholder="Auto-detected from file"
        />
        <p className="text-xs text-stone-400 mt-1">Auto-filled when you select a video file</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsFree(!isFree)}
          className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${isFree ? 'bg-jungle-500' : 'bg-stone-300'}`}
        >
          <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${isFree ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
        <span className="text-sm font-medium text-stone-700">Free video</span>
      </div>

      {!isFree && prices && (
        <div className="bg-jungle-50 border border-jungle-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-jungle-800 mb-2">Auto-calculated fun prices</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Supported', price: prices.supported },
              { label: 'Community', price: prices.community },
              { label: 'Abundance', price: prices.abundance },
            ].map(({ label, price }) => (
              <div key={label} className="bg-white rounded-lg p-3 border border-jungle-100">
                <p className="text-xs text-stone-500">{label}</p>
                <p className="font-black text-jungle-800">{formatPrice(price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? (progress ?? 'Uploading…') : 'Save as draft'}
      </button>
      <p className="text-xs text-stone-400 text-center">
        Saved as draft — publish from Studio when ready.
      </p>
    </form>
  )
}

const inputClass = 'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400'
