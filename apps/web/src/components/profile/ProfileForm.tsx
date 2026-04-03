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

export function ProfileForm({ profile, userId, email, isCreator }: Props) {
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

  // ── Password ──────────────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: 'Passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ ok: false, text: 'Password must be at least 8 characters.' })
      return
    }
    setPasswordSaving(true)
    setPasswordMsg(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPasswordMsg({ ok: true, text: 'Password updated.' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      setPasswordMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to update password.' })
    } finally {
      setPasswordSaving(false)
    }
  }

  // ── Delete account ────────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to delete account')
      }
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong.')
      setDeleting(false)
    }
  }

  const deleteConfirmHandle = profile?.username ?? ''

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
      </section>

      {/* Security */}
      <section className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
        <h2 className="font-bold text-stone-900">Security</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordMsg(null) }}
              required
              minLength={8}
              className={inputClass}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordMsg(null) }}
              required
              className={inputClass}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>
          {passwordMsg && (
            <p className={`text-sm px-3 py-2 rounded-lg ${passwordMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {passwordMsg.text}
            </p>
          )}
          <button type="submit" disabled={passwordSaving} className={btnClass}>
            {passwordSaving ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      {/* Creator — link to studio pricing */}
      {isCreator && (
        <section className="bg-white rounded-2xl border border-stone-200 p-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-stone-900">Pricing rates</h2>
            <p className="text-sm text-stone-500 mt-0.5">Set your per-minute rates in Studio Settings.</p>
          </div>
          <Link
            href="/studio/settings"
            className="flex-shrink-0 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Studio Settings →
          </Link>
        </section>
      )}

      {/* Danger Zone */}
      <section className="bg-white rounded-2xl border border-red-200 p-8 space-y-4">
        <h2 className="font-bold text-red-700">Danger zone</h2>
        <p className="text-sm text-stone-600">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          Delete account
        </button>
      </section>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-5">
            <h3 className="text-xl font-black text-stone-900">Delete your account?</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              This will permanently delete your account, profile, and all your data.{' '}
              <strong className="text-stone-900">This cannot be undone.</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Type <span className="font-mono font-bold text-stone-900">@{deleteConfirmHandle}</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError(null) }}
                className={inputClass}
                placeholder={`@${deleteConfirmHandle}`}
                autoFocus
              />
            </div>
            {deleteError && (
              <p className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); setDeleteError(null) }}
                disabled={deleting}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm !== `@${deleteConfirmHandle}`}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40"
              >
                {deleting ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputClass = 'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400'
const btnClass = 'bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-colors disabled:opacity-50'
