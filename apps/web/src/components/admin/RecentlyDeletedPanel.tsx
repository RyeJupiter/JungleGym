'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { restoreDeletedVideo } from '@/app/admin/actions'

export type DeletedVideo = {
  videoId: string
  title: string
  creatorName: string | null
  creatorUsername: string | null
  deletedAt: string
  daysRemaining: number
}

export function RecentlyDeletedPanel({ videos }: { videos: DeletedVideo[] }) {
  const router = useRouter()
  const [restoring, setRestoring] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleRestore(videoId: string) {
    setRestoring((r) => ({ ...r, [videoId]: true }))
    setErrors((e) => {
      const next = { ...e }
      delete next[videoId]
      return next
    })
    // Server action uses the service client because admins don't own
    // the video and RLS would reject a direct client update.
    const result = await restoreDeletedVideo(videoId)
    if (result.error) {
      setErrors((e) => ({ ...e, [videoId]: result.error! }))
      setRestoring((r) => ({ ...r, [videoId]: false }))
      return
    }
    router.refresh()
  }

  if (videos.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
        Recently deleted
        <span className="text-xs font-semibold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
          {videos.length}
        </span>
      </h2>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h3 className="text-sm font-bold text-stone-900">Videos deleted in the last 30 days</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Click Restore to clear the deletion flag. The video stays unpublished so
            the creator can review before making it public again.
          </p>
        </div>

        <ul className="divide-y divide-stone-100">
          {videos.map((v) => (
            <li key={v.videoId} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                      {v.daysRemaining}d left
                    </span>
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      {v.title}
                    </p>
                  </div>
                  <p className="text-xs text-stone-500">
                    {v.creatorName ?? 'Unknown creator'}
                    {v.creatorUsername && (
                      <>
                        {' · '}
                        <Link href={`/@${v.creatorUsername}`} target="_blank" className="hover:text-jungle-600">
                          @{v.creatorUsername}
                        </Link>
                      </>
                    )}
                    {' · deleted '}
                    <span suppressHydrationWarning>
                      {new Date(v.deletedAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </p>
                  {errors[v.videoId] && (
                    <p className="mt-1.5 text-xs text-red-600">
                      Restore failed: {errors[v.videoId]}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleRestore(v.videoId)}
                  disabled={restoring[v.videoId]}
                  className="shrink-0 text-sm font-semibold px-3 py-1.5 rounded-lg bg-white border border-jungle-300 text-jungle-700 hover:bg-jungle-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {restoring[v.videoId] ? 'Restoring…' : 'Restore'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
