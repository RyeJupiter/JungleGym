'use client'

import { useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import * as tus from 'tus-js-client'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { calculateTierPrices, formatPrice } from '@junglegym/shared'
import { TagInput } from './TagInput'
import { VideoThumbnailPicker } from './VideoThumbnailPicker'
import { PolishButton } from '@/components/PolishButton'
import { suggestTagsFromTitle } from '@/lib/movementTags'
import type { AudioChunk } from '@/lib/audioExtract'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

async function uploadVideoResumable(
  file: File,
  path: string,
  accessToken: string,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        'x-upsert': 'false',
      },
      uploadDataDuringCreation: false, // keep creation request tiny — just metadata
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: 'videos',
        objectName: path,
        contentType: file.type,
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024,
      onError: (err) => reject(new Error(err instanceof Error ? err.message : String(err))),
      onProgress: (bytesUploaded, bytesTotal) => {
        if (bytesTotal > 0) onProgress(Math.round((bytesUploaded / bytesTotal) * 100))
      },
      onSuccess: () => resolve(),
    })

    if (signal) {
      signal.addEventListener('abort', () => {
        upload.abort()
        reject(new Error('Upload cancelled'))
      })
    }

    upload.start()
  })
}

export function VideoUploadForm({
  creatorId,
  defaultRates,
  stripeConnected = false,
}: {
  creatorId: string
  defaultRates: { supported: number; community: number; abundance: number }
  stripeConnected?: boolean
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isFree, setIsFree] = useState(!stripeConnected)
  const [durationSecs, setDurationSecs] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [priceOverrides, setPriceOverrides] = useState<{ supported: string; community: string; abundance: string } | null>(null)
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  // Audio extraction runs in the background as soon as the user picks a
  // file. The promise resolves to chunks ready for upload — or null if
  // extraction failed (video still uploads normally, transcription is
  // skipped and will surface on the admin Issues panel).
  const audioExtractRef = useRef<Promise<AudioChunk[] | null> | null>(null)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const tagSuggestions = useMemo(() => suggestTagsFromTitle(title), [title])

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

    // Kick off audio extraction immediately so it runs in parallel with
    // the user filling in title/description/tags. We swallow errors here
    // and resolve to null — the main upload flow must not depend on this.
    audioExtractRef.current = (async () => {
      try {
        const { extractAudioChunks } = await import('@/lib/audioExtract')
        return await extractAudioChunks(file)
      } catch (err) {
        console.warn('Audio extraction failed:', err)
        return null
      }
    })()

    const url = URL.createObjectURL(file)
    const el = document.createElement('video')
    el.preload = 'metadata'
    el.muted = true
    el.onloadedmetadata = () => {
      setDurationSecs(Math.round(el.duration).toString())
      setPriceOverrides(null)
      // Seek to 10% of duration (min 1s) for a more representative frame
      el.currentTime = Math.min(Math.max(1, el.duration * 0.1), el.duration - 0.1)
    }
    el.onseeked = () => {
      // Only auto-set thumbnail if the user hasn't picked one manually
      if (!thumbnailFile) {
        const canvas = document.createElement('canvas')
        canvas.width = el.videoWidth
        canvas.height = el.videoHeight
        canvas.getContext('2d')?.drawImage(el, 0, 0)
        canvas.toBlob((blob) => {
          if (!blob) return
          const thumb = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })
          setThumbnailFile(thumb)
          if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
          setThumbnailPreview(URL.createObjectURL(thumb))
        }, 'image/jpeg', 0.85)
      }
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
    setUploadPct(null)
    abortRef.current = new AbortController()

    try {
      const videoId = crypto.randomUUID()
      let videoStoragePath: string | null = null
      let thumbnailPublicUrl: string | null = null

      if (videoFile) {
        setProgress('Uploading video…')
        setUploadPct(0)
        const ext = videoFile.name.split('.').pop()
        const path = `${creatorId}/${videoId}.${ext}`
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Not authenticated')
        await uploadVideoResumable(videoFile, path, session.access_token, (pct) => {
          setUploadPct(pct)
        }, abortRef.current.signal)
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
      const saveRes = await fetch('/api/videos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: videoId,
          title,
          description: description || null,
          tags,
          duration_seconds: duration || null,
          is_free: isFree,
          price_supported: (!isFree && prices) ? prices.supported : null,
          price_community: (!isFree && prices) ? prices.community : null,
          price_abundance: (!isFree && prices) ? prices.abundance : null,
          video_url: videoStoragePath,
          thumbnail_url: thumbnailPublicUrl,
        }),
      })
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({ error: 'Save failed' }))
        throw new Error(err.error ?? 'Save failed')
      }

      // Kick off audio upload + transcribe API entirely in the background.
      // The creator should not have to wait on ffmpeg or Groq to get back
      // to the studio — any failure just means captions don't materialize
      // and the admin Issues panel surfaces it. We capture everything we
      // need into local variables so the IIFE can survive this component
      // unmounting on router.push.
      const audioPromise = audioExtractRef.current
      if (audioPromise) {
        ;(async () => {
          try {
            const chunks = await audioPromise
            if (!chunks || chunks.length === 0) return
            const paths: string[] = []
            for (const chunk of chunks) {
              const path = `audio/${creatorId}/${videoId}/${String(chunk.index).padStart(3, '0')}.webm`
              const { error: audioErr } = await supabase.storage
                .from('transcripts')
                .upload(path, chunk.blob, { contentType: 'audio/webm', upsert: true })
              if (audioErr) throw audioErr
              paths.push(path)
            }
            // keepalive lets the POST survive navigation + tab-backgrounding.
            await fetch(`/api/transcribe/${videoId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioPaths: paths }),
              keepalive: true,
            })
          } catch (err) {
            console.warn('Background transcription setup failed:', err)
          }
        })()
      }

      router.push('/studio')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
      setProgress(null)
      setUploadPct(null)
      abortRef.current = null
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
  }

  const fileSizeMB = videoFile ? (videoFile.size / 1024 / 1024).toFixed(0) : null
  const durationDisplay = duration > 0
    ? duration >= 60
      ? `${Math.floor(duration / 60)}m ${duration % 60}s`
      : `${duration}s`
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</p>}

      {/* Drop zones */}
      <div className="grid grid-cols-5 gap-3">
        {/* Video — 4 cols */}
        <div className="col-span-4">
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoFile} className="hidden" />
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className={`w-full rounded-2xl border-2 border-dashed transition-colors py-10 text-center ${
              videoFile
                ? 'border-jungle-300 bg-jungle-50'
                : 'border-stone-200 hover:border-jungle-300 bg-white hover:bg-jungle-50/40'
            }`}
          >
            {videoFile ? (
              <div className="space-y-1">
                <p className="text-2xl">🎬</p>
                <p className="text-sm font-semibold text-jungle-800 truncate px-4">{videoFile.name}</p>
                <p className="text-xs text-stone-400">{fileSizeMB} MB{durationDisplay ? ` · ${durationDisplay}` : ''}</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-2xl">🎬</p>
                <p className="text-sm font-semibold text-stone-500">Drop video here</p>
                <p className="text-xs text-stone-400">MP4, WebM, MOV · up to 5 GB</p>
              </div>
            )}
          </button>
        </div>

        {/* Thumbnail — 1 col */}
        <div className="col-span-1 flex flex-col gap-2">
          <input ref={thumbInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setThumbnailFile(file)
                if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
                setThumbnailPreview(file ? URL.createObjectURL(file) : null)
              }} className="hidden" />
          <button
            type="button"
            onClick={() => thumbInputRef.current?.click()}
            className={`w-full rounded-2xl border-2 border-dashed transition-colors overflow-hidden aspect-video ${
              thumbnailFile
                ? 'border-jungle-300'
                : 'border-stone-200 hover:border-jungle-300 bg-white hover:bg-jungle-50/40'
            }`}
          >
            {thumbnailPreview ? (
              <img
                src={thumbnailPreview}
                alt="Thumbnail preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 h-full py-6">
                <p className="text-xl">🖼️</p>
                <p className="text-xs text-stone-400 text-center leading-tight">Upload</p>
              </div>
            )}
          </button>
          <VideoThumbnailPicker
            videoSrc={videoFile}
            triggerLabel="Choose frame"
            onCapture={(file, previewUrl) => {
              if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
              setThumbnailFile(file)
              setThumbnailPreview(previewUrl)
            }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} placeholder="Kettlebell Swing Masterclass" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} placeholder="What will learners take away?" />
          <PolishButton
            className="mt-2"
            kind="description"
            current={description}
            context={{ title, tags }}
            onAccept={(next) => setDescription(next)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Tags</label>
          <TagInput
            tags={tags}
            onChange={setTags}
            suggestions={tagSuggestions}
            placeholder="strength, kettlebell, beginner…"
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-700">Pricing</span>
          <label className={`flex items-center gap-2 ${stripeConnected ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
            <span className="text-sm text-stone-500">Free</span>
            <button
              type="button"
              onClick={() => stripeConnected && setIsFree(!isFree)}
              disabled={!stripeConnected}
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                !stripeConnected
                  ? 'bg-jungle-500'
                  : isFree ? 'bg-jungle-500' : 'bg-stone-300'
              }`}
            >
              <span className={`inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                !stripeConnected
                  ? 'translate-x-4'
                  : isFree ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </button>
          </label>
        </div>

        {!stripeConnected && (
          <div className="bg-amber-50 rounded-xl px-4 py-3">
            <p className="text-sm text-amber-800 font-medium">Paid videos require a connected Stripe account</p>
            <p className="text-xs text-amber-600 mt-1">
              Set up payouts so you can receive your 80% share of each sale.{' '}
              <a href="/settings?tab=payments" className="underline font-medium hover:text-amber-800 transition-colors">
                Connect Stripe in Settings
              </a>
            </p>
          </div>
        )}

        {stripeConnected && !isFree && calculatedPrices && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'supported', label: 'Supported' },
                { key: 'community', label: 'Community' },
                { key: 'abundance', label: 'Abundance' },
              ] as const).map(({ key, label }) => {
                const val = priceOverrides?.[key] ?? String(calculatedPrices[key])
                return (
                  <div key={key}>
                    <label className="block text-xs text-stone-500 mb-1">{label}</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                      <input
                        type="number" step="0.01" min="0.01" value={val}
                        onChange={(e) => setPriceOverrides((prev) => ({
                          supported: prev?.supported ?? String(calculatedPrices.supported),
                          community: prev?.community ?? String(calculatedPrices.community),
                          abundance: prev?.abundance ?? String(calculatedPrices.abundance),
                          [key]: e.target.value,
                        }))}
                        className="w-full rounded-lg border border-stone-200 bg-stone-50 pl-6 pr-2 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-jungle-400"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            {priceOverrides && (
              <button type="button" onClick={() => setPriceOverrides(null)} className="text-xs text-stone-400 hover:text-jungle-600 transition-colors">
                ↩ Reset to auto-calculated
              </button>
            )}
          </div>
        )}

        {stripeConnected && !isFree && !calculatedPrices && (
          <p className="text-xs text-stone-400">Add a video file or enter duration to calculate prices.</p>
        )}
      </div>

      {/* Submit / progress */}
      {loading && uploadPct !== null ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-stone-700">{progress ?? 'Uploading…'}</span>
            <span className="text-stone-400 tabular-nums">{uploadPct}%</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-1.5">
            <div className="bg-jungle-500 h-1.5 rounded-full transition-all duration-200" style={{ width: `${uploadPct}%` }} />
          </div>
          <button type="button" onClick={handleCancel} className="text-xs text-stone-400 hover:text-red-500 transition-colors">
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="submit" disabled={loading}
          className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save as draft'}
        </button>
      )}
    </form>
  )
}

const inputClass = 'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400'
