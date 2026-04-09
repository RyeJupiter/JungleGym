'use client'

import { useState } from 'react'

const PREFS = [
  { key: 'purchase_notifications', label: 'Purchase notifications', desc: 'Get notified when someone buys your video' },
  { key: 'new_classes', label: 'New classes & creators', desc: 'Hear about new content from teachers you follow' },
  { key: 'live_session_reminders', label: 'Live session reminders', desc: 'Reminders before sessions you\'ve bookmarked' },
  { key: 'platform_updates', label: 'Platform updates', desc: 'Product updates and new features' },
] as const

export function EmailPreferences() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PREFS.map((p) => [p.key, true]))
  )

  function toggle(key: string) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-stone-900">Email preferences</h2>
        <span className="text-xs font-medium text-stone-400 bg-stone-100 px-2 py-1 rounded-full">Coming soon</span>
      </div>
      <p className="text-sm text-stone-400 mb-5">
        These preferences will take effect once our email system is live.
      </p>
      <div className="space-y-4">
        {PREFS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-stone-700">{label}</p>
              <p className="text-xs text-stone-400">{desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              onClick={() => toggle(key)}
              className="relative flex-shrink-0 w-10 h-6 rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400"
              style={{ background: prefs[key] ? '#22c55e' : '#d1d5db' }}
            >
              <span
                className="absolute top-0.5 left-0 w-5 h-5 rounded-sm bg-white shadow-sm transition-transform duration-200"
                style={{ transform: prefs[key] ? 'translateX(18px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
