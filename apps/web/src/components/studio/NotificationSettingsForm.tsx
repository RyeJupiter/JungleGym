'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

import type { NotificationPref } from '@/hooks/useCreatorNotifications'

type Props = {
  userId: string
  notificationPref: NotificationPref
  notificationThreshold: number
  notificationEmail: string | null
}

export function NotificationSettingsForm({ userId, notificationPref: initPref, notificationThreshold: initThreshold, notificationEmail: initEmail }: Props) {
  const [notificationPref, setNotificationPref] = useState<NotificationPref>(initPref ?? 'every')
  const [notificationThreshold, setNotificationThreshold] = useState(initThreshold?.toString() ?? '0')
  const [notificationEmail, setNotificationEmail] = useState(initEmail ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          notification_pref: notificationPref,
          notification_threshold: parseFloat(notificationThreshold) || 0,
          notification_email: notificationEmail || null,
        })
        .eq('user_id', userId)

      if (updateError) throw updateError
      setSaved(true)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>}
      {saved && <p className="bg-jungle-50 text-jungle-700 rounded-lg px-4 py-3 text-sm">Saved!</p>}

      <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
        <div>
          <h2 className="font-bold text-stone-900">Drop-in notifications</h2>
          <p className="text-sm text-stone-400 mt-0.5">How you want to hear when someone drops into your class.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {([
            { value: 'every', label: 'Every sale', emoji: '🎉' },
            { value: 'threshold', label: 'Above $X', emoji: '💰' },
            { value: 'daily', label: 'Daily', emoji: '📅' },
            { value: 'weekly', label: 'Weekly', emoji: '📊' },
            { value: 'off', label: 'Off', emoji: '🔕' },
          ] as const).map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => setNotificationPref(value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                notificationPref === value
                  ? 'border-jungle-500 bg-jungle-50 text-jungle-800'
                  : 'border-stone-200 text-stone-500 hover:border-stone-300'
              }`}
            >
              <span className="text-xl">{emoji}</span>
              {label}
            </button>
          ))}
        </div>

        {notificationPref === 'threshold' && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Notify when drop-in exceeds ($)
            </label>
            <input
              type="number" min="0" step="1" value={notificationThreshold}
              onChange={(e) => setNotificationThreshold(e.target.value)}
              className={inputClass} placeholder="20" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Notification email <span className="text-stone-400 font-normal">(optional — for daily/weekly summaries)</span>
          </label>
          <input
            type="email" value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            className={inputClass} placeholder="you@example.com" />
        </div>
      </div>

      <button
        type="submit" disabled={loading}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save notifications'}
      </button>
    </form>
  )
}

const inputClass = 'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400'
