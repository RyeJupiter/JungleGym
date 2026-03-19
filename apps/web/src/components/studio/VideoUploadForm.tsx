'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as tus from 'tus-js-client'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { calculateTierPrices, formatPrice } from '@junglegym/shared'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

async function uploadVideoResumable(
  file: File,
  path: string,
  accessToken: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        'x-upsert': 'false',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: 'videos',
        objectName: path,
        contentType: file.type,
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024, // 6 MB chunks
      onError: reject,
      onProgress: (bytesUploaded, bytesTotal) => {
        onProgress(Math.round((bytesUploaded / bytesTotal) * 100))
      },
      onSuccess: () => resolve(),
    })
    upload.start()
  })
}

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
  const [priceOverrides, setPriceOverrides] = useState<{ supported: string; community: string; abundance: string } | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const duration = parseInt(durationSecs) || 0
  const calculatedPrices = duration > 0 ? calculateTierPrices(duration, defaultRates) : null

  // Sync overrides when calculated prices change (but don't overwrite manual edits)
  const prices = priceOverrides
    ? {
        supported: parseFloat(priceOverrides.supported) || calculatedPrices?.supported || 0,
        community: parseFloat(priceOverrides.community) || calculatedPrices?.community || 0,
        abundance: parseFloat(priceOverrides.abundance) || calculatedPrices?.abundance || 0,
      }
    : calculatedPrices

  function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    const el = document.createElement('video')
    el.preload = 'metadata'
    el.onloadedmetadata = () => {
      const secs = Math.round(el.duration).toString()
      setDurationSecs(secs)
      // Reset price overrides so new auto-calculated prices show
      setPriceOverrides(null)
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
        setProgress('Uploading video… 0%')
        const ext = videoFile.name.split('.').pop()
        const path = `${creatorId}/${videoId}.${ext}`
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Not authenticated')
        await uploadVideoResumable(videoFile, path, session.access_token, (pct) => {
          setProgress(`Uploading video… ${pct}%`)
        })
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

      {!isFree && calculatedPrices && (
        <div className="bg-jungle-50 border border-jungle-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-jungle-800">Prices</p>
            {priceOverrides && (
              <button
                type="button"
                onClick={() => setPriceOverrides(null)}
                className="text-xs text-jungle-500 hover:text-jungle-700"
              >
                Reset to auto
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'supported', label: 'Supported' },
              { key: 'community', label: 'Community' },
              { key: 'abundance', label: 'Abundance' },
            ] as const).map(({ key, label }) => {
              const auto = calculatedPrices[key]
              const val = priceOverrides?.[key] ?? String(auto)
              return (
                <div key={key}>
                  <label className="block text-xs text-jungle-600 font-medium mb-1">{label}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={val}
                      onChange={(e) => setPriceOverrides((prev) => ({
                        supported: prev?.supported ?? String(calculatedPrices.supported),
                        community: prev?.community ?? String(calculatedPrices.community),
                        abundance: prev?.abundance ?? String(calculatedPrices.abundance),
                        [key]: e.target.value,
                      }))}
                      className="w-full rounded-lg border border-jungle-200 bg-white pl-6 pr-2 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-jungle-400"
                    />
                  </div>
                  {!priceOverrides && <p className="text-xs text-jungle-400 mt-0.5 text-center">auto</p>}
                </div>
              )
            })}
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
