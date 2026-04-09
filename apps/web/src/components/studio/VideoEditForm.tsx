'use client'

import { useState, useMemo } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { formatPrice } from '@junglegym/shared'
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

export function VideoEditForm({ video, videoPublicUrl, onSaved }: Props) {
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description ?? '')
  const [tags, setTags] = useState<string[]>(video.tags)
  const [isFree, setIsFree] = useState(video.is_free)
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
        price_supported: isFree ? null : video.price_supported,
        price_community: isFree ? null : video.price_community,
        price_abundance: isFree ? null : video.price_abundance,
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
          {thumbnailPreview && (
            <div className="rounded-xl overflow-hidden aspect-video bg-stone-100 mb-2 max-w-xs">
              <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
            </div>
          )}
          <VideoThumbnailPicker
            videoSrc={videoPublicUrl}
            triggerLabel={thumbnailPreview ? 'Choose different frame' : 'Choose frame from video'}
            onCapture={(file, previewUrl) => {
              setNewThumbnailFile(file)
              setThumbnailPreview(previewUrl)
            }}
          />
          {!videoPublicUrl && (
            <p className="text-xs text-stone-400">No video file — thumbnail cannot be changed here.</p>
          )}
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

        {!video.is_free && (
          <div className="bg-stone-50 rounded-xl p-4 text-sm text-stone-600">
            <p className="font-semibold mb-1">Pricing</p>
            <div className="flex gap-4">
              <span>Supported: <strong>{video.price_supported ? formatPrice(video.price_supported) : '—'}</strong></span>
              <span>Community: <strong>{video.price_community ? formatPrice(video.price_community) : '—'}</strong></span>
              <span>Abundance: <strong>{video.price_abundance ? formatPrice(video.price_abundance) : '—'}</strong></span>
            </div>
            <p className="text-xs text-stone-400 mt-1">Prices are set at upload time based on duration.</p>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="rounded accent-jungle-500" />
          Free video
        </label>
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
