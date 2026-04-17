'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export function ScheduleSessionForm({ creatorId, stripeConnected = false }: { creatorId: string; stripeConnected?: boolean }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState('60')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.from('live_sessions').insert({
        creator_id: creatorId,
        title,
        description: description || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: parseInt(duration),
        status: 'scheduled',
      })
      if (error) throw error
      router.push('/studio')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to schedule session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
      {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Session title *</label>
        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          required className={inputClass} placeholder="Morning Mobility Flow"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          rows={3} className={inputClass}
          placeholder="What will you be covering? What should people bring?"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Date & time *</label>
          <input
            type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
            required className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Duration (minutes)</label>
          <input
            type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
            min="5" max="480" className={inputClass}
          />
        </div>
      </div>

      <div className="bg-jungle-50 border border-jungle-100 rounded-xl p-4 text-sm text-jungle-700">
        🎁 Gift-based — learners give freely, you receive 100% of every gift.
      </div>

      {!stripeConnected && (
        <div className="bg-amber-50 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-800 font-medium">Stripe account required to receive gifts</p>
          <p className="text-xs text-amber-600 mt-1">
            Connect your bank account so viewers can send you gifts during the session.{' '}
            <a href="/settings?tab=payments" className="underline font-medium hover:text-amber-800 transition-colors">
              Connect Stripe in Settings
            </a>
          </p>
        </div>
      )}

      <button
        type="submit" disabled={loading || !stripeConnected}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Scheduling...' : 'Schedule session'}
      </button>
    </form>
  )
}

const inputClass = 'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400'
