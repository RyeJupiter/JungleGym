'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { formatPrice } from '@junglegym/shared'

type Video = {
  id: string
  title: string
  is_free: boolean
  price_supported: number | null
  published: boolean
  thumbnail_url: string | null
}

export function VideoRow({ video, index }: { video: Video; index: number }) {
  const [published, setPublished] = useState(video.published)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  async function togglePublish() {
    setLoading(true)
    const next = !published
    const { error } = await supabase
      .from('videos')
      .update({ published: next })
      .eq('id', video.id)
    if (!error) {
      setPublished(next)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className={`flex items-center justify-between px-5 py-4 ${index > 0 ? 'border-t border-stone-100' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-8 rounded bg-stone-100 overflow-hidden flex items-center justify-center text-xs flex-shrink-0">
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
          ) : '🌿'}
        </div>
        <div>
          <p className="font-semibold text-stone-900 text-sm">{video.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {video.is_free ? (
              <span className="text-xs bg-jungle-50 text-jungle-700 px-2 py-0.5 rounded-full font-medium">Free</span>
            ) : (
              <span className="text-xs text-stone-400">
                from {video.price_supported ? formatPrice(video.price_supported) : '—'}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              published ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'
            }`}>
              {published ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={togglePublish}
          disabled={loading}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
            published
              ? 'bg-stone-100 hover:bg-stone-200 text-stone-600'
              : 'bg-jungle-600 hover:bg-jungle-700 text-white'
          }`}
        >
          {loading ? '…' : published ? 'Unpublish' : 'Publish'}
        </button>
        <Link href={`/studio/video/${video.id}/edit`} className="text-xs text-stone-400 hover:text-stone-700 font-medium">
          Edit
        </Link>
      </div>
    </div>
  )
}
