'use client'

import { useState, useMemo } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { TagInput } from './TagInput'
import { VideoThumbnailPicker } from './VideoThumbnailPicker'
import { suggestTagsFromTitle } from '@/lib/movementTags'

type Video = {
  id: string
  creator_id: string
  title: string
  description: string | null
  tags: string[]
  is_free: boolean
  price_supported: number | null
  price_community: number | null
  price_abundance: number | null
  thumbnail_url: string | null
  video_url: string | null
}

type Props = {
  video: Video
  videoPublicUrl: string | null
  onSaved?: () => void
}

function getStep(value: number): number {
  if (value < 0.50) return 0.05
  if (value < 1.00) return 0.10
  if (value < 3.00) return 0.25
  if (value < 10.00) return 0.50
  return 1.00
}

function PriceInput({ label, value, onChange, disabled }: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  function increment() {
    const current = parseFloat(value) || 0
    const step = getStep(current)
    onChange((Math.round((current + step) * 100) / 100).toFixed(2))
  }
  function decrement() {
    const current = parseFloat(value) || 0
    // Use step for the value just below current so boundary transitions feel natural
    const step = getStep(Math.max(0, current - 0.001))
    onChange((Math.max(0, Math.round((current - step) * 100) / 100)).toFixed(2))
  }
  return (
    <div>
      <label className="block text-xs text-stone-500 mb-1">{label}</label>
      <div className={`flex items-center rounded-lg border border-stone-200 bg-white overflow-hidden ${disabled ? '' : 'focus-within:ring-2 focus-within:ring-jungle-400'}`}>
        <button
          type="button"
          onClick={decrement}
          disabled={disabled}
          className="px-2.5 py-2 text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors text-base leading-none select-none"
        >−</button>
        <div className="relative flex-1">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full pl-4 pr-1 py-2 text-sm text-stone-900 text-center bg-transparent focus:outline-none"
            placeholder="0.00"
          />
        </div>
        <button
          type="button"
          onClick={increment}
          disabled={disabled}
          className="px-2.5 py-2 text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors text-base leading-none select-none"
        >+</button>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className="relative flex-shrink-0 w-11 h-6 rounded-md transition-colors duration-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400"
      style={{ background: checked ? '#22c55e' : '#d1d5db' }}
    >
      <span
        className="absolute top-0.5 left-0 w-5 h-5 rounded-sm bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(21px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

export function VideoEditForm({ video, videoPublicUrl, onSaved }: Props) {
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description ?? '')
  const [tags, setTags] = useState<string[]>(video.tags)
  const [isFree, setIsFree] = useState(video.is_free)
  const [priceSupported, setPriceSupported] = useState(video.price_supported?.toString() ?? '')
  const [priceCommunity, setPriceCommunity] = useState(video.price_community?.toString() ?? '')
  const [priceAbundance, setPriceAbundance] = useState(video.price_abundance?.toString() ?? '')
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(video.thumbnail_url ?? null)
  const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const supabase = createBrowserSupabaseClient()

  const tagSuggestions = useMemo(() => suggestTagsFromTitle(title), [title])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        title,
        description: description || null,
        tags,
        is_free: isFree,
        price_supported: isFree ? null : (parseFloat(priceSupported) || null),
        price_community: isFree ? null : (parseFloat(priceCommunity) || null),
        price_abundance: isFree ? null : (parseFloat(priceAbundance) || null),
      }

      if (newThumbnailFile) {
        const ext = newThumbnailFile.name.split('.').pop() ?? 'jpg'
        const path = `${video.creator_id}/${video.id}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(path, newThumbnailFile, { cacheControl: '3600', upsert: true })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(path)
        payload.thumbnail_url = `${publicUrl}?v=${Date.now()}`
      }

      const { error } = await supabase.from('videos').update(payload).eq('id', video.id)
      if (error) throw error
      setSaved(true)
      setNewThumbnailFile(null)
      onSaved?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>}
      {saved && <p className="bg-jungle-50 text-jungle-700 rounded-lg px-4 py-3 text-sm">Saved ✓</p>}

      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Thumbnail</label>
          <div className="flex items-start gap-4">
            {thumbnailPreview && (
              <div className="rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 w-40 aspect-video">
                <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
              </div>
            )}
            {videoPublicUrl ? (
              <VideoThumbnailPicker
                videoSrc={videoPublicUrl}
                triggerLabel={thumbnailPreview ? 'Choose a different frame' : 'Choose frame from video'}
                onCapture={(file, previewUrl) => {
                  setNewThumbnailFile(file)
                  setThumbnailPreview(previewUrl)
                }}
              />
            ) : (
              <p className="text-xs text-stone-400 self-center">No video file — thumbnail cannot be changed here.</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Tags</label>
          <TagInput tags={tags} onChange={setTags} suggestions={tagSuggestions} />
        </div>

        {/* Pricing */}
        <div className="bg-stone-50 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-700">Pricing</span>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <span className="text-sm text-stone-500">Free</span>
              <Toggle checked={isFree} onChange={() => setIsFree(!isFree)} />
            </label>
          </div>

          <div className={`grid grid-cols-3 gap-3 transition-opacity ${isFree ? 'opacity-40 pointer-events-none' : ''}`}>
            <PriceInput label="Supported" value={priceSupported} onChange={setPriceSupported} disabled={isFree} />
            <PriceInput label="Community" value={priceCommunity} onChange={setPriceCommunity} disabled={isFree} />
            <PriceInput label="Abundance" value={priceAbundance} onChange={setPriceAbundance} disabled={isFree} />
          </div>

          {!isFree && (
            <p className="text-xs text-stone-400">Changes apply to future purchases only — past transactions are unaffected.</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}

const inputClass = 'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400'
