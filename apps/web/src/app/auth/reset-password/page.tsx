'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setSaving(true)
    setError(null)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      // Invalidate all existing sessions / JWTs
      await supabase.auth.signOut({ scope: 'global' })

      setDone(true)
      setTimeout(() => router.push('/auth/login'), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password.')
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-jungle-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="font-black text-2xl text-white">
            jungle<span className="text-jungle-400">gym</span>
          </a>
          <h1 className="text-3xl font-black text-white mt-6">Reset password</h1>
          <p className="text-jungle-400 mt-2">Choose a new password for your account.</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          {done ? (
            <div className="text-center space-y-3">
              <p className="text-4xl">✓</p>
              <p className="font-bold text-stone-900">Password updated!</p>
              <p className="text-sm text-stone-500">All sessions have been signed out. Redirecting to login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400"
                  placeholder="At least 8 characters"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(null) }}
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400"
                  placeholder="Same password again"
                />
              </div>
              {error && (
                <p className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg">{error}</p>
              )}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Set new password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
