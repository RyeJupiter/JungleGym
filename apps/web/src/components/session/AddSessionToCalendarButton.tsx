'use client'

import { useState, useRef, useEffect } from 'react'
import { buildSessionCalUrl, buildSessionIcs, downloadIcs } from '@/lib/gcal'

export function AddSessionToCalendarButton({
  session,
}: {
  session: {
    title: string
    description: string | null
    scheduled_at: string
    duration_minutes: number
  }
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const gcalUrl = buildSessionCalUrl(session)

  function handleApple() {
    const ics = buildSessionIcs(session)
    downloadIcs(`${session.title.replace(/\s+/g, '-')}.ics`, ics)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-stone-500 hover:text-jungle-700 font-medium flex items-center gap-1 transition-colors"
      >
        📅 Add to calendar
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden z-20 min-w-[180px]">
          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Google Calendar
          </a>
          <button
            onClick={handleApple}
            className="block w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Apple Calendar (.ics)
          </button>
        </div>
      )}
    </div>
  )
}
