'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

type Application = {
  id: string
  user_id: string
  motivation: string | null
  status: string
  created_at: string
  users: { email: string } | null
  profiles: { display_name: string; username: string } | null
}

export function ApplicationsPanel({ applications }: { applications: Application[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  async function approve(app: Application) {
    setLoading(app.id)
    setError(null)
    try {
      const { error: roleError } = await supabase
        .from('users')
        .update({ role: 'creator' })
        .eq('id', app.user_id)
      if (roleError) throw roleError

      const { error: appError } = await supabase
        .from('teacher_applications')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', app.id)
      if (appError) throw appError

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setLoading(null)
    }
  }

  async function reject(app: Application) {
    setLoading(app.id)
    setError(null)
    try {
      const { error: appError } = await supabase
        .from('teacher_applications')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', app.id)
      if (appError) throw appError

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      setLoading(null)
    }
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
        <p className="text-4xl mb-3">📭</p>
        <p className="font-medium">No pending applications</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>}
      {applications.map((app) => (
        <div key={app.id} className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-stone-900">
                  {app.profiles?.display_name ?? 'Unknown'}
                </p>
                {app.profiles?.username && (
                  <span className="text-xs text-stone-400">@{app.profiles.username}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  app.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                  app.status === 'approved' ? 'bg-green-50 text-green-700' :
                  'bg-red-50 text-red-600'
                }`}>
                  {app.status}
                </span>
              </div>
              <p className="text-sm text-stone-500 mb-3">{app.users?.email}</p>
              {app.motivation ? (
                <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 rounded-xl px-4 py-3">
                  {app.motivation}
                </p>
              ) : (
                <p className="text-sm text-stone-400 italic">No motivation provided</p>
              )}
              <p className="text-xs text-stone-400 mt-2" suppressHydrationWarning>
                Applied {new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            {app.status === 'pending' && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => approve(app)}
                  disabled={loading === app.id}
                  className="bg-jungle-600 hover:bg-jungle-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading === app.id ? '…' : 'Approve'}
                </button>
                <button
                  onClick={() => reject(app)}
                  disabled={loading === app.id}
                  className="bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
