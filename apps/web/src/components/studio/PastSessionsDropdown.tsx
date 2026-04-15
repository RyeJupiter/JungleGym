'use client'

import { useState } from 'react'
import Link from 'next/link'

type Session = {
  id: string
  title: string
  scheduled_at: string
  duration_minutes: number
  status: string
}

export function PastSessionsDropdown({ sessions }: { sessions: Session[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
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
        Past sessions ({sessions.length})
      </button>

      {open && (
        <div className="mt-3 bg-white rounded-2xl border border-stone-200 overflow-hidden">
          {sessions.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-stone-100' : ''}`}
            >
              <Link href={`/sessions/${s.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <p className="font-semibold text-stone-600 text-sm">{s.title}</p>
                <p className="text-xs text-stone-400 mt-0.5" suppressHydrationWarning>
                  {new Date(s.scheduled_at).toLocaleDateString(undefined, {
                    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })} · {s.duration_minutes} min
                </p>
              </Link>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  s.status === 'completed' ? 'bg-stone-100 text-stone-500' : 'bg-red-50 text-red-400'
                }`}>
                  {s.status}
                </span>
                <Link
                  href={`/studio/sessions/${s.id}/manage`}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
