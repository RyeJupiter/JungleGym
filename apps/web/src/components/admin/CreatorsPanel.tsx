'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { searchUsers, setCreatorRole, type UserSearchResult } from '@/app/admin/actions'
import { ApplicationCard, type AdminApplication } from './ApplicationCard'

function Avatar({ photoUrl, displayName, size = 'md' }: { photoUrl: string | null; displayName: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-10 h-10 text-sm'
  return (
    <div className={`${dim} rounded-full overflow-hidden bg-jungle-100 flex-shrink-0 flex items-center justify-center font-semibold text-jungle-600`}>
      {photoUrl
        ? <img src={photoUrl} alt={displayName ?? ''} className="w-full h-full object-cover" />
        : <span>🌿</span>}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      role === 'creator' ? 'bg-jungle-100 text-jungle-700' : 'bg-stone-100 text-stone-500'
    }`}>
      {role}
    </span>
  )
}

function UserCard({ user, onSelect }: { user: UserSearchResult; onSelect: (u: UserSearchResult) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(user)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-left"
    >
      <Avatar photoUrl={user.photoUrl} displayName={user.displayName} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-900 truncate">
          {user.displayName ?? <span className="text-stone-400 italic">No display name</span>}
          {user.username && <span className="text-stone-400 font-normal"> @{user.username}</span>}
        </p>
        <p className="text-xs text-stone-400 truncate">{user.email}</p>
      </div>
      <RoleBadge role={user.role} />
    </button>
  )
}

// ── Search + Select box ──────────────────────────────────────────────────────

function UserSearch({
  placeholder,
  onSelect,
}: {
  placeholder: string
  onSelect: (user: UserSearchResult) => void
}) {
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
          placeholder={placeholder}
          className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-jungle-500 pr-10"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-jungle-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden divide-y divide-stone-100">
          {results.map((u) => (
            <UserCard key={u.userId} user={u} onSelect={handleSelect} />
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
  onDone,
}: {
  user: UserSearchResult
  onClose: () => void
  onDone: (updated: UserSearchResult) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isCreator = user.role === 'creator'

  function handleToggle() {
    setError(null)
    startTransition(async () => {
      const result = await setCreatorRole(user.userId, !isCreator)
      if (result.error) {
        setError(result.error)
      } else {
        onDone({ ...user, role: isCreator ? 'learner' : 'creator' })
      }
    })
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar photoUrl={user.photoUrl} displayName={user.displayName} size="lg" />
          <div>
            <p className="text-lg font-black text-stone-900">
              {user.displayName ?? <span className="text-stone-400 italic font-normal">No display name</span>}
            </p>
            {user.username && <p className="text-sm text-stone-500">@{user.username}</p>}
            <p className="text-sm text-stone-500">{user.email}</p>
            <div className="mt-1"><RoleBadge role={user.role} /></div>
          </div>
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl leading-none flex-shrink-0">×</button>
      </div>

      {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>}

      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`w-full font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 ${
          isCreator
            ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            : 'bg-jungle-600 hover:bg-jungle-700 text-white'
        }`}
      >
        {isPending ? '…' : isCreator ? 'Revoke creator access' : 'Grant creator access'}
      </button>
    </div>
  )
}

// ── Creator row ──────────────────────────────────────────────────────────────

function CreatorRow({ user, onRevoke }: { user: UserSearchResult; onRevoke: (u: UserSearchResult) => void }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRevoke() {
    setError(null)
    startTransition(async () => {
      const result = await setCreatorRole(user.userId, false)
      if (result.error) { setError(result.error); setConfirming(false) }
      else { onRevoke(user) }
    })
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <Avatar photoUrl={user.photoUrl} displayName={user.displayName} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-900 truncate">
          {user.displayName ?? <span className="text-stone-400 italic">No display name</span>}
          {user.username && <span className="text-stone-400 font-normal"> @{user.username}</span>}
        </p>
        <p className="text-xs text-stone-400 truncate">{user.email}</p>
        {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
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
            onClick={handleRevoke}
            disabled={isPending}
            className="text-xs px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? '…' : 'Confirm'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="flex-shrink-0 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          Revoke
        </button>
      )}
    </div>
  )
}

// ── Applications section ─────────────────────────────────────────────────────

function ApplicationsSection({
  pendingApplications,
  reviewedCount,
}: {
  pendingApplications: AdminApplication[]
  reviewedCount: number
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">
          Pending <span className="text-stone-300 font-normal normal-case tracking-normal">({pendingApplications.length})</span>
        </h3>
        {reviewedCount > 0 && (
          <Link
            href="/admin/applications/reviewed"
            className="text-xs font-semibold text-jungle-700 hover:text-jungle-500 transition-colors"
          >
            View reviewed ({reviewedCount}) →
          </Link>
        )}
      </div>

      {pendingApplications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-400">
          <p className="text-3xl mb-2">📭</p>
          <p className="font-medium text-sm">No pending applications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingApplications.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main panel ───────────────────────────────────────────────────────────────

export function CreatorsPanel({
  initialCreators,
  pendingApplications,
  reviewedCount,
}: {
  initialCreators: UserSearchResult[]
  pendingApplications: AdminApplication[]
  reviewedCount: number
}) {
  const [creators, setCreators] = useState(initialCreators)
  const [selected, setSelected] = useState<UserSearchResult | null>(null)

  function handleDone(updated: UserSearchResult) {
    if (updated.role === 'creator') {
      setCreators((prev) => prev.some((c) => c.userId === updated.userId)
        ? prev.map((c) => c.userId === updated.userId ? updated : c)
        : [...prev, updated])
    } else {
      setCreators((prev) => prev.filter((c) => c.userId !== updated.userId))
    }
    setSelected(null)
  }

  function handleRevoke(user: UserSearchResult) {
    setCreators((prev) => prev.filter((c) => c.userId !== user.userId))
  }

  return (
    <div className="space-y-10">

      {/* Applications */}
      <div>
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">
          Applications
        </h2>
        <ApplicationsSection pendingApplications={pendingApplications} reviewedCount={reviewedCount} />
      </div>

      {/* Manual management */}
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">
          Manage creators
        </h2>

        {/* Search */}
        <div className="space-y-3">
          <UserSearch
            placeholder="Search by name, username, or email…"
            onSelect={setSelected}
          />
          {selected && (
            <ConfirmationCard
              user={selected}
              onClose={() => setSelected(null)}
              onDone={handleDone}
            />
          )}
        </div>

        {/* Current creators */}
        <div>
          <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-2">
            Current creators <span className="text-stone-300">({creators.length})</span>
          </p>
          {creators.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
              <p className="text-3xl mb-3">🌿</p>
              <p className="font-medium">No creators yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
              {creators.map((c) => (
                <CreatorRow key={c.userId} user={c} onRevoke={handleRevoke} />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
