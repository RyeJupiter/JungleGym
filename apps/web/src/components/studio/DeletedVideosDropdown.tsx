'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export type DeletedCreatorVideo = {
  id: string
  title: string
  thumbnail_url: string | null
  deleted_at: string
  days_remaining: number
}

export function DeletedVideosDropdown({ videos }: { videos: DeletedCreatorVideo[] }) {
  const [open, setOpen] = useState(false)
  const [restoring, setRestoring] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  async function handleRestore(videoId: string) {
    setRestoring((r) => ({ ...r, [videoId]: true }))
    setErrors((e) => {
      const next = { ...e }
      delete next[videoId]
      return next
    })
    // Creator owns the row — RLS "videos: creator update" policy allows
    // this direct update from the browser client, no server action needed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('videos')
      .update({ deleted_at: null })
      .eq('id', videoId)
    if (error) {
      setErrors((e) => ({ ...e, [videoId]: error.message }))
      setRestoring((r) => ({ ...r, [videoId]: false }))
      return
    }
    router.refresh()
  }

  if (videos.length === 0) return null

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Recently deleted ({videos.length})
      </button>

      {open && (
        <div className="mt-3 bg-white rounded-2xl border border-stone-200 overflow-hidden">
          {videos.map((v, i) => (
            <div
              key={v.id}
              className={`flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 ${i > 0 ? 'border-t border-stone-100' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {v.thumbnail_url ? (
                  <img
                    src={v.thumbnail_url}
                    alt=""
                    className="w-16 h-10 rounded object-cover grayscale opacity-60 flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-10 rounded bg-stone-100 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-600 text-sm truncate">{v.title}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    <span className="bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded mr-1.5">
                      {v.days_remaining}d left
                    </span>
                    deleted <span suppressHydrationWarning>{new Date(v.deleted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </p>
                  {errors[v.id] && (
                    <p className="text-xs text-red-600 mt-1">Restore failed: {errors[v.id]}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRestore(v.id)}
                disabled={restoring[v.id]}
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-jungle-300 text-jungle-700 hover:bg-jungle-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {restoring[v.id] ? 'Restoring…' : 'Restore'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
