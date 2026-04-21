'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

export type VideoTransaction = {
  id: string
  createdAt: string
  tier: string
  buyerName: string
  buyerUsername: string
  creatorAmount: number
  platformAmount: number
  total: number
}

type Props = {
  video: Video
  videoPublicUrl: string | null
  metrics: Metrics
  transactions: VideoTransaction[]
}

type Tab = 'metrics' | 'settings'

const TIER_STYLES: Record<string, string> = {
  supported: 'bg-green-50 text-green-700',
  community: 'bg-blue-50 text-blue-700',
  abundance: 'bg-purple-50 text-purple-700',
}

function fmt(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function VideoManagePage({ video, videoPublicUrl, metrics, transactions }: Props) {
  const [published, setPublished] = useState(video.published)
  const [toggling, setToggling] = useState(false)
  const [tab, setTab] = useState<Tab>('metrics')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  async function togglePublish() {
    setToggling(true)
    const next = !published
    const { error } = await supabase.from('videos').update({ published: next }).eq('id', video.id)
    if (!error) setPublished(next)
    setToggling(false)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    // Soft delete — sets deleted_at + unpublishes. A scheduled purge
    // job (TODO) hard-deletes rows + storage objects after 30 days.
    // Within that window admins can restore from /admin?tab=issues.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('videos')
      .update({ deleted_at: new Date().toISOString(), published: false })
      .eq('id', video.id)
    if (error) {
      setDeleteError(error.message)
      setDeleting(false)
      return
    }
    router.push('/studio')
    router.refresh()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="min-w-0 flex-1">
          <Link href="/studio" className="text-sm text-stone-400 hover:text-stone-600 transition-colors mb-2 inline-block">
            ← Studio
          </Link>
          <Link href={`/video/${video.id}`} className="block text-xl sm:text-2xl font-black text-stone-900 leading-snug hover:text-jungle-700 transition-colors">
            {video.title}
          </Link>
        </div>

        {/* Publish toggle */}
        <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3">
          <span className={`hidden sm:inline text-sm font-semibold ${published ? 'text-green-700' : 'text-stone-400'}`}>
            {toggling ? '…' : published ? 'Published' : 'Draft'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={published}
            onClick={togglePublish}
            disabled={toggling}
            className="relative w-12 h-7 rounded-md transition-colors duration-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400"
            style={{ background: published ? '#22c55e' : '#d1d5db' }}
          >
            <span
              className="absolute top-1 left-0 w-5 h-5 rounded-sm bg-white shadow-sm transition-transform duration-200"
              style={{ transform: published ? 'translateX(23px)' : 'translateX(3px)' }}
            />
          </button>
        </div>
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
        <div className="space-y-8">
          {/* Thumbnail */}
          {video.thumbnail_url && (
            <Link href={`/video/${video.id}`} className="block rounded-2xl overflow-hidden aspect-video bg-stone-100 max-w-sm hover:opacity-90 transition-opacity">
              <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
            </Link>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard label="Views" value={video.view_count.toLocaleString()} />
            <StatCard label="Purchases" value={metrics.purchaseCount.toLocaleString()} />
            <StatCard
              label="Earned"
              value={metrics.purchaseCount > 0 ? formatPrice(metrics.creatorEarnings) : '—'}
              sub={metrics.purchaseCount > 0 ? 'your 80% cut' : undefined}
            />
          </div>

          {/* Transactions */}
          <div>
            <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">Transactions</h2>

            {transactions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
                <p className="font-medium">No purchases yet</p>
                {!published && (
                  <p className="text-sm mt-1">
                    <button onClick={togglePublish} className="text-jungle-600 hover:underline font-medium">
                      Publish your video
                    </button>{' '}to start earning.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
                {transactions.map((t) => (
                  <div key={t.id} className="px-4 sm:px-5 py-3 sm:py-4 flex items-start justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${TIER_STYLES[t.tier] ?? 'bg-stone-100 text-stone-600'}`}>
                          {t.tier}
                        </span>
                        <p className="font-semibold text-stone-900 truncate text-sm sm:text-base">{t.buyerName}</p>
                        {t.buyerUsername && (
                          <p className="text-xs text-stone-400 truncate hidden sm:block">@{t.buyerUsername}</p>
                        )}
                      </div>
                      <p className="text-xs text-stone-400" suppressHydrationWarning>
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-stone-900 text-sm sm:text-base">{fmt(t.total)}</p>
                      <p className="text-xs text-stone-400">
                        {fmt(t.creatorAmount)} you · {fmt(t.platformAmount)} platform
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <>
          <VideoEditForm
            video={video}
            videoPublicUrl={videoPublicUrl}
          />

          {/* Danger zone */}
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50/50 p-5 sm:p-6">
            <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide mb-1">
              Danger zone
            </h3>
            <p className="text-sm text-red-700/80 mb-4">
              Delete this video. It will be hidden from the platform immediately.
              An admin can restore it within 30 days; after that it&apos;s gone for good.
            </p>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-white border border-red-300 text-red-700 hover:bg-red-100 transition-colors"
            >
              Delete video
            </button>
          </div>
        </>
      )}

      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm px-4"
          onClick={() => !deleting && setDeleteOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-stone-900 mb-2">
              Delete &quot;{video.title}&quot;?
            </h3>
            <p className="text-sm text-stone-600 mb-5">
              This hides the video from the platform immediately. An admin
              can restore it within 30 days; after that the video, its
              transcript, and its thumbnail are permanently deleted.
            </p>
            {deleteError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
                {deleteError}
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="text-sm font-semibold px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete video'}
              </button>
            </div>
          </div>
        </div>
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
