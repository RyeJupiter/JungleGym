'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

type Props = {
  username: string
  userId: string
}

export function DangerZone({ username, userId }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'warn' | 'confirm'>('warn')
  const [confirmInput, setConfirmInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  function open() { setStep('warn'); setConfirmInput(''); setError(null); setShowModal(true) }
  function close() { setShowModal(false); setConfirmInput(''); setError(null) }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to delete account')
      }
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setDeleting(false)
    }
  }

  return (
    <>
      <section className="bg-white rounded-2xl border border-red-200 p-8 space-y-4">
        <h2 className="font-bold text-red-700">Danger zone</h2>
        <p className="text-sm text-stone-600">Permanently delete your account and all associated data. This cannot be undone.</p>
        <button
          type="button"
          onClick={open}
          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          Delete account
        </button>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={close}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-5" onClick={(e) => e.stopPropagation()}>
            {step === 'warn' ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-stone-900">Are you sure?</h3>
                    <p className="text-sm text-stone-500 mt-0.5">This action is permanent and cannot be reversed.</p>
                  </div>
                </div>
                <ul className="text-sm text-stone-600 space-y-1.5 bg-red-50 rounded-xl px-4 py-3">
                  <li>Your account and login will be deleted</li>
                  <li>Your public profile will be removed</li>
                  <li>All your videos and purchases will be gone</li>
                  <li className="font-semibold text-red-700">There is no undo</li>
                </ul>
                <div className="flex gap-3">
                  <button type="button" onClick={close} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2.5 rounded-lg text-sm transition-colors">
                    No, keep my account
                  </button>
                  <button type="button" onClick={() => setStep('confirm')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                    Yes, I&apos;m sure
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-black text-stone-900">Final confirmation</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Type <span className="font-mono font-bold text-stone-900">@{username}</span> to permanently delete your account.
                </p>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => { setConfirmInput(e.target.value); setError(null) }}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400"
                  placeholder={`@${username}`}
                  autoFocus
                />
                {error && <p className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg">{error}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={close} disabled={deleting} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2.5 rounded-lg text-sm transition-colors">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting || confirmInput !== `@${username}`}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40"
                  >
                    {deleting ? 'Deleting…' : 'Delete forever'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
