'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

type Profile = {
  user_id: string
  username: string
  display_name: string
}

type Props = {
  profile: Profile | null
  userId: string
  email: string | null | undefined
  isCreator: boolean
}

export function ProfileForm({ profile, userId, email }: Props) {
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()

  // ── Username ──────────────────────────────────────────────────────────────
  const [username, setUsername] = useState(profile?.username ?? '')
  const [usernameSaving, setUsernameSaving] = useState(false)
  const [usernameMsg, setUsernameMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUsernameSaving(true)
    setUsernameMsg(null)
    try {
      const slug = username.toLowerCase().trim()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('profiles') as any)
        .update({ username: slug, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
      if (error) throw error
      setUsernameMsg({ ok: true, text: 'Username saved.' })
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      setUsernameMsg({ ok: false, text: msg.includes('unique') ? 'That username is already taken.' : msg })
    } finally {
      setUsernameSaving(false)
    }
  }

  // ── Password reset ────────────────────────────────────────────────────────
  const [resetSending, setResetSending] = useState(false)
  const [resetMsg, setResetMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handlePasswordReset() {
    if (!email) return
    setResetSending(true)
    setResetMsg(null)
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) throw error
      setResetMsg({ ok: true, text: 'Check your email — we sent a reset link valid for 1 hour.' })
    } catch (err: unknown) {
      setResetMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to send reset email.' })
    } finally {
      setResetSending(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Public profile CTA */}
      {profile?.username && (
        <div className="bg-jungle-50 border border-jungle-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-jungle-900">Public profile</p>
            <p className="text-xs text-jungle-600 mt-0.5">Name, bio, photo, tags, and location are edited directly on your Treehouse.</p>
          </div>
          <Link
            href={`/@${profile.username}?edit=true`}
            className="flex-shrink-0 bg-jungle-700 hover:bg-jungle-600 text-jungle-100 text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Edit Treehouse →
          </Link>
        </div>
      )}

      {/* Account */}
      <section className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
        <h2 className="font-bold text-stone-900">Account</h2>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
          <p className="w-full rounded-lg border border-stone-100 bg-stone-50 px-3 py-2.5 text-sm text-stone-500 select-all">
            {email ?? '—'}
          </p>
        </div>

        <form onSubmit={handleUsernameSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm select-none">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value.toLowerCase()); setUsernameMsg(null) }}
                required
                pattern="[a-z0-9_\-]{3,32}"
                title="3–32 characters: letters, numbers, _ or -"
                className={inputClass + ' pl-7'}
                placeholder="yourhandle"
              />
            </div>
            <p className="text-xs text-stone-400 mt-1">3–32 characters. Letters, numbers, _ and - only.</p>
          </div>
          {usernameMsg && (
            <p className={`text-sm px-3 py-2 rounded-lg ${usernameMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {usernameMsg.text}
            </p>
          )}
          <button type="submit" disabled={usernameSaving} className={btnClass}>
            {usernameSaving ? 'Saving…' : 'Save username'}
          </button>
        </form>

        {/* Password reset */}
        <div className="pt-2 border-t border-stone-100 space-y-3">
          <div>
            <p className="text-sm font-medium text-stone-700">Password</p>
            <p className="text-xs text-stone-400 mt-0.5">We&apos;ll send a secure reset link to your email, valid for 1 hour.</p>
          </div>
          {resetMsg && (
            <p className={`text-sm px-3 py-2 rounded-lg ${resetMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {resetMsg.text}
            </p>
          )}
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={resetSending || !email || !!resetMsg?.ok}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {resetSending ? 'Sending…' : resetMsg?.ok ? 'Email sent ✓' : 'Send reset link'}
          </button>
        </div>
      </section>
    </div>
  )
}

const inputClass = 'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400'
const btnClass = 'bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-colors disabled:opacity-50'
