'use client'

import { useState, useEffect, useTransition } from 'react'
import { addSiteAdmin, removeSiteAdmin, searchUsers, type UserSearchResult } from '@/app/admin/actions'

export type SiteAdmin = {
  email: string
  added_by: string | null
  added_at: string
}

function Avatar({ photoUrl, displayName }: { photoUrl: string | null; displayName: string | null }) {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-jungle-100 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-jungle-600">
      {photoUrl
        ? <img src={photoUrl} alt={displayName ?? ''} className="w-full h-full object-cover" />
        : <span>🌿</span>}
    </div>
  )
}

// ── Search + Select ──────────────────────────────────────────────────────────

function UserSearch({ onSelect }: { onSelect: (user: UserSearchResult) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const { results: res } = await searchUsers(query)
      setResults(res)
      setOpen(true)
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  function handleSelect(user: UserSearchResult) {
    onSelect(user)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search by name, username, or email…"
          className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-jungle-500 pr-10"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-jungle-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden divide-y divide-stone-100">
          {results.map((u) => (
            <button
              key={u.userId}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(u)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-left"
            >
              <Avatar photoUrl={u.photoUrl} displayName={u.displayName} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">
                  {u.displayName ?? <span className="text-stone-400 italic">No display name</span>}
                  {u.username && <span className="text-stone-400 font-normal"> @{u.username}</span>}
                </p>
                <p className="text-xs text-stone-400 truncate">{u.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && !searching && query.trim() && results.length === 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg px-4 py-3 text-sm text-stone-400">
          No users found
        </div>
      )}
    </div>
  )
}

// ── Confirmation card ────────────────────────────────────────────────────────

function ConfirmationCard({
  user,
  onClose,
  onAdded,
}: {
  user: UserSearchResult
  onClose: () => void
  onAdded: (email: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    setError(null)
    startTransition(async () => {
      const result = await addSiteAdmin(user.email)
      if (result.error) setError(result.error)
      else onAdded(user.email)
    })
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5 mt-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-jungle-100 flex-shrink-0 flex items-center justify-center text-xl">
            {user.photoUrl
              ? <img src={user.photoUrl} alt={user.displayName ?? ''} className="w-full h-full object-cover" />
              : <span>🌿</span>}
          </div>
          <div>
            <p className="text-base font-black text-stone-900">
              {user.displayName ?? <span className="text-stone-400 italic font-normal">No display name</span>}
            </p>
            {user.username && <p className="text-sm text-stone-500">@{user.username}</p>}
            <p className="text-sm text-stone-500">{user.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
              user.role === 'creator' ? 'bg-jungle-100 text-jungle-700' : 'bg-stone-100 text-stone-500'
            }`}>
              {user.role}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl leading-none flex-shrink-0">×</button>
      </div>

      {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>}

      <button
        onClick={handleAdd}
        disabled={isPending}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
      >
        {isPending ? 'Adding…' : `Add ${user.displayName ?? user.email} as admin`}
      </button>
    </div>
  )
}

// ── Admin row with confirmation ──────────────────────────────────────────────

function AdminRow({ admin, onRemove, isPending }: { admin: SiteAdmin; onRemove: (email: string) => void; isPending: boolean }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex items-center justify-between px-5 py-4 gap-4">
      <div className="min-w-0">
        <p className="text-stone-900 text-sm font-medium">{admin.email}</p>
        {admin.added_by && (
          <p className="text-xs text-stone-400 mt-0.5" suppressHydrationWarning>
            Added by {admin.added_by} · {new Date(admin.added_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>
      {confirming ? (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className="text-xs px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onRemove(admin.email)}
            disabled={isPending}
            className="text-xs px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? '…' : 'Confirm'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
        >
          Remove
        </button>
      )}
    </div>
  )
}

// ── Main panel ───────────────────────────────────────────────────────────────

export function AdminsPanel({ admins, superadminEmails }: { admins: SiteAdmin[]; superadminEmails: string[] }) {
  const [selected, setSelected] = useState<UserSearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Build unified list: superadmins first, then dynamic admins (excluding any overlap)
  const dynamicOnly = admins.filter((a) => !superadminEmails.includes(a.email))

  function handleRemove(email: string) {
    setError(null)
    startTransition(async () => {
      const result = await removeSiteAdmin(email)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-8">
      {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>}

      {/* All admins — unified list */}
      <div>
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Admins <span className="text-stone-300 font-normal normal-case tracking-normal">({superadminEmails.length + dynamicOnly.length})</span>
        </h2>
        <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
          {/* Superadmins — no remove button */}
          {superadminEmails.map((email) => (
            <div key={email} className="flex items-center justify-between px-5 py-4 gap-4">
              <p className="text-stone-900 text-sm font-medium">{email}</p>
              <span className="text-xs bg-jungle-100 text-jungle-700 font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
                superadmin
              </span>
            </div>
          ))}
          {/* Dynamic admins — removable */}
          {dynamicOnly.map((admin) => (
            <AdminRow key={admin.email} admin={admin} onRemove={handleRemove} isPending={isPending} />
          ))}
        </div>
      </div>

      {/* Add admin */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">
          Add admin
        </h2>
        <UserSearch onSelect={setSelected} />
        {selected && (
          <ConfirmationCard
            user={selected}
            onClose={() => setSelected(null)}
            onAdded={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  )
}
