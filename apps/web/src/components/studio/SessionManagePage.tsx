'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

type Session = {
  id: string
  creator_id: string
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
  status: string
  max_participants: number | null
}

type Metrics = {
  giftCount: number
  totalGifts: number
  totalCreator: number
}

export type GiftTransaction = {
  id: string
  createdAt: string
  giverName: string
  giverUsername: string
  message: string | null
  creatorAmount: number
  platformAmount: number
  total: number
}

type Props = {
  session: Session
  metrics: Metrics
  transactions: GiftTransaction[]
}

type Tab = 'overview' | 'settings'

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  live: 'bg-red-50 text-red-600',
  completed: 'bg-stone-100 text-stone-500',
  cancelled: 'bg-red-50 text-red-400',
}

function fmt(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

// Local datetime string for datetime-local input (strips timezone)
function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function SessionManagePage({ session: initial, metrics, transactions }: Props) {
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')

  // Settings form state
  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description ?? '')
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(initial.scheduled_at))
  const [duration, setDuration] = useState(String(initial.duration_minutes))
  const [maxParticipants, setMaxParticipants] = useState(initial.max_participants ? String(initial.max_participants) : '')
  const [status, setStatus] = useState(initial.status)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    try {
      const { error } = await supabase
        .from('live_sessions')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          scheduled_at: new Date(scheduledAt).toISOString(),
          duration_minutes: parseInt(duration),
          max_participants: maxParticipants ? parseInt(maxParticipants) : null,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', initial.id)
      if (error) throw error
      setSaveMsg({ ok: true, text: 'Session updated.' })
      router.refresh()
    } catch (err: unknown) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to save.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this session permanently? This cannot be undone.')) return
    const { error } = await supabase.from('live_sessions').delete().eq('id', initial.id)
    if (error) { alert(error.message); return }
    router.push('/studio')
    router.refresh()
  }

  const isPast = new Date(initial.scheduled_at) < new Date()

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <Link href="/studio" className="text-xs text-stone-400 hover:text-stone-600 transition-colors mb-2 inline-block">
            ← Studio
          </Link>
          <h1 className="text-3xl font-black text-stone-900">{title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_STYLES[status] ?? 'bg-stone-100 text-stone-500'}`}>
              {status}
            </span>
            <span className="text-sm text-stone-500">{formatDateTime(initial.scheduled_at)}</span>
            <span className="text-sm text-stone-400">· {initial.duration_minutes} min</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-stone-100 p-1 rounded-xl w-fit">
        {(['overview', 'settings'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ──────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard label="Total gifts" value={fmt(metrics.totalGifts)} />
            <StatCard label="Your earnings" value={fmt(metrics.totalCreator)} />
            <StatCard label="Gift count" value={String(metrics.giftCount)} />
          </div>

          {/* Gift transactions */}
          <section>
            <h2 className="text-lg font-bold text-stone-900 mb-4">Gifts</h2>
            {transactions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
                <p className="text-3xl mb-3">🎁</p>
                <p className="font-medium">No gifts yet</p>
                {!isPast && <p className="text-sm mt-1">Gifts will appear here as they come in.</p>}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 text-xs text-stone-400 uppercase tracking-widest">
                      <th className="text-left px-5 py-3">Giver</th>
                      <th className="text-left px-5 py-3">Message</th>
                      <th className="text-left px-5 py-3">Date</th>
                      <th className="text-right px-5 py-3">Creator</th>
                      <th className="text-right px-5 py-3">Platform</th>
                      <th className="text-right px-5 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={t.id} className={i > 0 ? 'border-t border-stone-100' : ''}>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-stone-900">{t.giverName}</p>
                          {t.giverUsername && (
                            <p className="text-xs text-stone-400">@{t.giverUsername}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-stone-500 max-w-xs">
                          {t.message ? (
                            <span className="italic text-xs">"{t.message}"</span>
                          ) : (
                            <span className="text-stone-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-stone-400 text-xs whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-green-700">{fmt(t.creatorAmount)}</td>
                        <td className="px-5 py-3.5 text-right text-stone-400">{fmt(t.platformAmount)}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-stone-900">{fmt(t.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Settings ──────────────────────────────────────────────────── */}
      {tab === 'settings' && (
        <form onSubmit={handleSave} className="space-y-6">
          <section className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
            <h2 className="font-bold text-stone-900">Details</h2>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
              <input
                type="text" value={title} onChange={(e) => { setTitle(e.target.value); setSaveMsg(null) }}
                required className={inputClass} placeholder="Morning Mobility Flow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
              <textarea
                value={description} onChange={(e) => { setDescription(e.target.value); setSaveMsg(null) }}
                rows={4} className={inputClass}
                placeholder="What will you cover? What should participants bring?"
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
            <h2 className="font-bold text-stone-900">Schedule</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Date & time *</label>
                <input
                  type="datetime-local" value={scheduledAt}
                  onChange={(e) => { setScheduledAt(e.target.value); setSaveMsg(null) }}
                  required className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Duration (minutes)</label>
                <input
                  type="number" value={duration} min="5" max="480"
                  onChange={(e) => { setDuration(e.target.value); setSaveMsg(null) }}
                  required className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Max participants <span className="text-stone-400 font-normal">(optional)</span></label>
              <input
                type="number" value={maxParticipants} min="1"
                onChange={(e) => { setMaxParticipants(e.target.value); setSaveMsg(null) }}
                className={inputClass} placeholder="Unlimited"
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
            <h2 className="font-bold text-stone-900">Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['scheduled', 'live', 'completed', 'cancelled'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setStatus(s); setSaveMsg(null) }}
                  className={`py-2.5 rounded-lg text-sm font-semibold capitalize border transition-colors ${
                    status === s
                      ? 'bg-jungle-700 border-jungle-700 text-white'
                      : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-400">
              Setting to <strong>live</strong> makes it visible as live now on your Treehouse. <strong>Cancelled</strong> hides it.
            </p>
          </section>

          <div className="bg-jungle-50 border border-jungle-100 rounded-xl px-5 py-4 text-sm text-jungle-700">
            🎁 Gift-based — learners give freely. 80% goes to you, 20% to JungleGym.
          </div>

          {saveMsg && (
            <p className={`text-sm px-4 py-3 rounded-lg ${saveMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {saveMsg.text}
            </p>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit" disabled={saving}
              className="bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button" onClick={handleDelete}
              className="text-red-500 hover:text-red-700 text-sm font-semibold transition-colors"
            >
              Delete session
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-stone-900">{value}</p>
    </div>
  )
}

const inputClass = 'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400'
