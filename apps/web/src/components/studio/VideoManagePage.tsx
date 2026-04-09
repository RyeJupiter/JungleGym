'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { formatPrice } from '@junglegym/shared'
import { VideoEditForm } from './VideoEditForm'

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
  published: boolean
  thumbnail_url: string | null
  video_url: string | null
  view_count: number
  duration_seconds: number | null
}

type Metrics = {
  purchaseCount: number
  creatorEarnings: number
}

type Props = {
  video: Video
  videoPublicUrl: string | null
  metrics: Metrics
}

type Tab = 'metrics' | 'settings'

export function VideoManagePage({ video, videoPublicUrl, metrics }: Props) {
  const [published, setPublished] = useState(video.published)
  const [toggling, setToggling] = useState(false)
  const [tab, setTab] = useState<Tab>('metrics')
  const supabase = createBrowserSupabaseClient()

  async function togglePublish() {
    setToggling(true)
    const next = !published
    const { error } = await supabase.from('videos').update({ published: next }).eq('id', video.id)
    if (!error) setPublished(next)
    setToggling(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <Link href="/studio" className="text-sm text-stone-400 hover:text-stone-600 transition-colors mb-2 inline-block">
            ← Studio
          </Link>
          <h1 className="text-2xl font-black text-stone-900 leading-snug">{video.title}</h1>
        </div>

        {/* Publish toggle */}
        <button
          onClick={togglePublish}
          disabled={toggling}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
            published
              ? 'bg-green-50 text-green-700 hover:bg-green-100'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${published ? 'bg-green-500' : 'bg-stone-400'}`} />
          {toggling ? '…' : published ? 'Published' : 'Draft'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 mb-8">
        {(['metrics', 'settings'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize border-b-2 transition-colors -mb-px ${
              tab === t
                ? 'border-jungle-600 text-jungle-700'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Metrics tab */}
      {tab === 'metrics' && (
        <div className="space-y-6">
          {/* Thumbnail */}
          {video.thumbnail_url && (
            <div className="rounded-2xl overflow-hidden aspect-video bg-stone-100 max-w-sm">
              <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Views" value={video.view_count.toLocaleString()} />
            <StatCard label="Purchases" value={metrics.purchaseCount.toLocaleString()} />
            <StatCard
              label="Earned"
              value={metrics.purchaseCount > 0 ? formatPrice(metrics.creatorEarnings) : '—'}
              sub={metrics.purchaseCount > 0 ? 'your 80% cut' : undefined}
            />
          </div>

          {metrics.purchaseCount === 0 && (
            <p className="text-sm text-stone-400 text-center py-4">
              No purchases yet.{' '}
              {!published && (
                <button onClick={togglePublish} className="text-jungle-600 hover:underline font-medium">
                  Publish your video
                </button>
              )}{' '}
              {published && 'Share it to start earning.'}
            </p>
          )}
        </div>
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <VideoEditForm
          video={video}
          videoPublicUrl={videoPublicUrl}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-black text-stone-900">{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  )
}
