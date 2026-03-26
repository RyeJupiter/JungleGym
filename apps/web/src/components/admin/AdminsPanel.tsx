'use client'

import { useState, useTransition } from 'react'
import { addSiteAdmin, removeSiteAdmin } from '@/app/admin/actions'

export type SiteAdmin = {
  email: string
  added_by: string | null
  added_at: string
}

export function AdminsPanel({
  admins,
  hardcodedAdmins,
}: {
  admins: SiteAdmin[]
  hardcodedAdmins: string[]
}) {
  const [newEmail, setNewEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await addSiteAdmin(newEmail)
      if (result.error) {
        setError(result.error)
      } else {
        setNewEmail('')
      }
    })
  }

  function handleRemove(email: string) {
    setError(null)
    startTransition(async () => {
      const result = await removeSiteAdmin(email)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>
      )}

      {/* Permanent admins */}
      <div>
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Permanent (hardcoded)
        </h2>
        <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
          {hardcodedAdmins.map((email) => (
            <div key={email} className="flex items-center justify-between px-5 py-4">
              <span className="text-stone-900 text-sm font-medium">{email}</span>
              <span className="text-xs text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
                always admin
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic admins */}
      <div>
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Dynamic admins
        </h2>
        {admins.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
            <p className="text-3xl mb-3">👤</p>
            <p className="font-medium">No dynamic admins added yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
            {admins.map((admin) => (
              <div key={admin.email} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="min-w-0">
                  <p className="text-stone-900 text-sm font-medium">{admin.email}</p>
                  {admin.added_by && (
                    <p className="text-xs text-stone-400 mt-0.5">
                      Added by {admin.added_by} · {new Date(admin.added_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(admin.email)}
                  disabled={isPending}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add admin form */}
      <div>
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Add admin
        </h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            required
            className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-jungle-500"
          />
          <button
            type="submit"
            disabled={isPending || !newEmail}
            className="bg-jungle-600 hover:bg-jungle-700 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {isPending ? 'Adding…' : 'Add admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
