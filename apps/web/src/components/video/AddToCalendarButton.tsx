'use client'

import { useState } from 'react'
import { buildVideoCalUrl, RRULE_OPTIONS, buildIcsContent, downloadIcs } from '@/lib/gcal'

export function AddToCalendarButton({ videoTitle, videoId }: { videoTitle: string; videoId: string }) {
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState('07:00')
  const [rrule, setRrule] = useState<string>(RRULE_OPTIONS[0].value)

  const calUrl = buildVideoCalUrl({ videoTitle, videoId, timeHHMM: time, rrule })
  const rruleLabel = RRULE_OPTIONS.find((o) => o.value === rrule)?.label ?? ''

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        📅 Add to routine
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl">
            <h3 className="font-black text-stone-900 text-lg mb-1">Build a practice routine</h3>
            <p className="text-stone-500 text-sm mb-6">
              Add a recurring Google Calendar event so you never miss a session.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Time of day</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Frequency</label>
                <select
                  value={rrule}
                  onChange={(e) => setRrule(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400 bg-white"
                >
                  {RRULE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="bg-jungle-50 border border-jungle-100 rounded-xl p-3 text-sm text-jungle-700">
                📌 <strong>{rruleLabel}</strong> at {time} — <span className="text-jungle-500">{videoTitle.slice(0, 40)}{videoTitle.length > 40 ? '…' : ''}</span>
              </div>

              <div className="space-y-2">
                <a
                  href={calUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl text-sm text-center transition-colors"
                >
                  Open in Google Calendar →
                </a>
                <button
                  onClick={() => {
                    const [hours, minutes] = time.split(':').map(Number)
                    const start = new Date()
                    start.setHours(hours, minutes, 0, 0)
                    if (start <= new Date()) start.setDate(start.getDate() + 1)
                    const end = new Date(start.getTime() + 60 * 60 * 1000)
                    const ics = buildIcsContent({
                      title: `Practice: ${videoTitle}`,
                      description: `${window.location.origin}/video/${videoId}`,
                      start,
                      end,
                    })
                    downloadIcs(`practice-${videoTitle.replace(/\s+/g, '-')}.ics`, ics)
                  }}
                  className="block w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 rounded-xl text-sm text-center transition-colors"
                >
                  Download for Apple Calendar (.ics)
                </button>
              </div>
              <p className="text-xs text-stone-400 text-center">
                Google Calendar opens in a new tab. Apple Calendar downloads an .ics file.
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full text-stone-400 hover:text-stone-600 text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
