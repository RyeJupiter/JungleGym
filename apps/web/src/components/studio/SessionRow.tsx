'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

type Session = {
  id: string
  title: string
  scheduled_at: string
  duration_minutes: number
  status: string
}

const STATUS_STYLES: Record<string, string> = {
  live: 'bg-red-50 text-red-600',
  completed: 'bg-stone-100 text-stone-500',
  cancelled: 'bg-stone-100 text-stone-400',
}

export function SessionRow({ session: s, index, isGoLive }: { session: Session; index: number; isGoLive: boolean }) {
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()
  const [goingLive, setGoingLive] = useState(false)

  async function handleGoLive() {
    setGoingLive(true)
    const { error } = await supabase
      .from('live_sessions')
      .update({ status: 'live', updated_at: new Date().toISOString() })
      .eq('id', s.id)
    if (error) { alert(error.message); setGoingLive(false); return }
    router.refresh()
  }

  return (
    <div className={`flex items-center justify-between px-5 py-4 ${index > 0 ? 'border-t border-stone-100' : ''}`}>
      <div>
        <p className="font-semibold text-stone-900 text-sm">{s.title}</p>
        <p className="text-xs text-stone-400 mt-0.5">
          {new Date(s.scheduled_at).toLocaleDateString(undefined, {
            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
          })} · {s.duration_minutes} min
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isGoLive ? (
          <button
            onClick={handleGoLive}
            disabled={goingLive}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 animate-pulse"
          >
            {goingLive ? 'Going live…' : '● Go Live'}
          </button>
        ) : s.status === 'scheduled' ? (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize bg-blue-50 text-blue-600">
            Scheduled
          </span>
        ) : (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[s.status] ?? 'bg-stone-100 text-stone-500'}`}>
            {s.status}
          </span>
        )}
        <Link
          href={`/studio/sessions/${s.id}/manage`}
          className="text-xs text-stone-400 hover:text-stone-700 font-medium transition-colors"
        >
          Manage
        </Link>
      </div>
    </div>
  )
}
