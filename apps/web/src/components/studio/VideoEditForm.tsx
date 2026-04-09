'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { formatPrice } from '@junglegym/shared'
import { TagInput } from './TagInput'
import { suggestTagsFromTitle } from '@/lib/movementTags'

type Video = {
  id: string
  title: string
  description: string | null
  tags: string[]
  is_free: boolean
  price_supported: number | null
  price_community: number | null
  price_abundance: number | null
  published: boolean
  thumbnail_url: string | null
  video_url: string | null
}

export function VideoEditForm({ video }: { video: Video }) {
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description ?? '')
  const [tags, setTags] = useState<string[]>(video.tags)
  const [isFree, setIsFree] = useState(video.is_free)
  const [published, setPublished] = useState(video.published)
  const [thumbnailUrl, setThumbnailUrl] = useState(video.thumbnail_url ?? '')
  const [videoUrl, setVideoUrl] = useState(video.video_url ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const tagSuggestions = useMemo(() => suggestTagsFromTitle(title), [title])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      const { error } = await supabase.from('videos').update({
        title,
        description: description || null,
        tags,
        is_free: isFree,
        price_supported: isFree ? null : video.price_supported,
        price_community: isFree ? null : video.price_community,
        price_abundance: isFree ? null : video.price_abundance,
        published,
        thumbnail_url: thumbnailUrl || null,
        video_url: videoUrl || null,
      }).eq('id', video.id)
      if (error) throw error
      setSaved(true)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this video? This cannot be undone.')) return
    setLoading(true)
    try {
      const { error } = await supabase.from('videos').delete().eq('id', video.id)
      if (error) throw error
      router.push('/studio')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>}
      {saved && <p className="bg-jungle-50 text-jungle-700 rounded-lg px-4 py-3 text-sm">Saved ✓</p>}

      <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
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
          <TagInput
            tags={tags}
            onChange={setTags}
            suggestions={tagSuggestions}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Video storage path</label>
          <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputClass} placeholder="creator_id/video_id.mp4" />
          <p className="text-xs text-stone-400 mt-1">Storage path from the videos bucket (e.g. <code>abc123/video.mp4</code>)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Thumbnail URL</label>
          <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className={inputClass} placeholder="https://..." />
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

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
            <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="rounded accent-jungle-500" />
            Free video
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="rounded accent-jungle-500" />
            Published
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="flex-1 bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : 'Save changes'}
        </button>
        <button type="button" onClick={handleDelete} disabled={loading} className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-5 py-3 rounded-xl transition-colors text-sm">
          Delete
        </button>
      </div>
    </form>
  )
}

const inputClass = 'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400'
