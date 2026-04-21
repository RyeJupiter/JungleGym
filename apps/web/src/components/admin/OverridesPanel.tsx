'use client'

import { useState, useTransition } from 'react'
import {
  searchVideosForAdmin,
  searchUsers,
  getVideoAccessList,
  adminGrantVideoAccess,
  adminRevokeVideoAccess,
  toggleAdminPreviewMode,
  type AdminVideoSearchResult,
  type UserSearchResult,
  type VideoAccessEntry,
} from '@/app/admin/actions'

type Props = { previewModeOn: boolean }

export function OverridesPanel({ previewModeOn }: Props) {
  const [isPending, startTransition] = useTransition()
  const [previewOn, setPreviewOn] = useState(previewModeOn)

  // Video search
  const [videoQuery, setVideoQuery] = useState('')
  const [videoResults, setVideoResults] = useState<AdminVideoSearchResult[]>([])
  const [videoSearchError, setVideoSearchError] = useState<string | null>(null)

  // Selected video + its current access list
  const [selected, setSelected] = useState<AdminVideoSearchResult | null>(null)
  const [entries, setEntries] = useState<VideoAccessEntry[]>([])
  const [listError, setListError] = useState<string | null>(null)

  // Grant-to-user search
  const [userQuery, setUserQuery] = useState('')
  const [userResults, setUserResults] = useState<UserSearchResult[]>([])
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionOk, setActionOk] = useState<string | null>(null)

  function doVideoSearch(q: string) {
    setVideoQuery(q)
    setVideoSearchError(null)
    if (!q.trim()) {
      setVideoResults([])
      return
    }
    startTransition(async () => {
      const { results, error } = await searchVideosForAdmin(q)
      if (error) setVideoSearchError(error)
      setVideoResults(results)
    })
  }

  function selectVideo(v: AdminVideoSearchResult) {
    setSelected(v)
    setVideoResults([])
    setVideoQuery('')
    setActionError(null)
    setActionOk(null)
    loadAccessList(v.videoId)
  }

  function loadAccessList(videoId: string) {
    setListError(null)
    startTransition(async () => {
      const { entries, error } = await getVideoAccessList(videoId)
      if (error) setListError(error)
      setEntries(entries)
    })
  }

  function doUserSearch(q: string) {
    setUserQuery(q)
    if (!q.trim()) {
      setUserResults([])
      return
    }
    startTransition(async () => {
      const { results } = await searchUsers(q)
      setUserResults(results)
    })
  }

  function grant(userId: string) {
    if (!selected) return
    setActionError(null)
    setActionOk(null)
    startTransition(async () => {
      const { error } = await adminGrantVideoAccess(userId, selected.videoId)
      if (error) setActionError(error)
      else {
        setActionOk('Access granted.')
        setUserQuery('')
        setUserResults([])
        loadAccessList(selected.videoId)
      }
    })
  }

  function revoke(userId: string) {
    if (!selected) return
    if (!confirm('Revoke this admin-granted access?')) return
    setActionError(null)
    setActionOk(null)
    startTransition(async () => {
      const { error } = await adminRevokeVideoAccess(userId, selected.videoId)
      if (error) setActionError(error)
      else {
        setActionOk('Access revoked.')
        loadAccessList(selected.videoId)
      }
    })
  }

  function togglePreview() {
    const next = !previewOn
    startTransition(async () => {
      const { error } = await toggleAdminPreviewMode(next)
      if (!error) setPreviewOn(next)
    })
  }

  return (
    <div className="space-y-8">
      {/* Preview-all toggle */}
      <section className="bg-white rounded-2xl border border-red-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900 mb-1 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded">
                Admin
              </span>
              Preview all videos
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              When on, you can open any paid video without owning it. Scoped to your session via a
              24-hour HttpOnly cookie. No purchase rows are created.
            </p>
          </div>
          <button
            type="button"
            onClick={togglePreview}
            disabled={isPending}
            className={`shrink-0 relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              previewOn ? 'bg-red-500' : 'bg-stone-300'
            } ${isPending ? 'opacity-50' : ''}`}
            aria-pressed={previewOn}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                previewOn ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {previewOn && (
          <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Preview mode is ON. Your video page views will bypass the purchase gate. Disable when
            you're done.
          </p>
        )}
      </section>

      {/* Video search */}
      <section className="bg-white rounded-2xl border border-stone-200 p-5">
        <h2 className="text-lg font-bold text-stone-900 mb-3">Find a video</h2>
        <input
          type="text"
          value={videoQuery}
          onChange={(e) => doVideoSearch(e.target.value)}
          placeholder="Search by video title or creator name/username..."
          className="w-full px-4 py-2.5 border border-stone-300 rounded-lg text-sm focus:border-jungle-500 focus:outline-none"
        />
        {videoSearchError && (
          <p className="text-sm text-red-600 mt-2">{videoSearchError}</p>
        )}
        {videoResults.length > 0 && (
          <ul className="mt-3 border border-stone-200 rounded-lg divide-y divide-stone-100 max-h-80 overflow-y-auto">
            {videoResults.map((v) => (
              <li key={v.videoId}>
                <button
                  type="button"
                  onClick={() => selectVideo(v)}
                  className="w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900 truncate flex-1">{v.title}</span>
                    {v.isFree && (
                      <span className="text-xs bg-jungle-100 text-jungle-700 px-2 py-0.5 rounded-full">
                        Free
                      </span>
                    )}
                    {!v.published && (
                      <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    by {v.creatorDisplayName ?? '—'}
                    {v.creatorUsername && <> · @{v.creatorUsername}</>}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Selected video management */}
      {selected && (
        <section className="bg-white rounded-2xl border border-jungle-200 p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-jungle-700 mb-0.5">
                Selected
              </p>
              <h3 className="font-black text-stone-900 truncate">{selected.title}</h3>
              <p className="text-xs text-stone-500 truncate">
                by {selected.creatorDisplayName ?? '—'}
                {selected.creatorUsername && <> · @{selected.creatorUsername}</>}
                {selected.isFree && ' · Free video'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-sm text-stone-500 hover:text-stone-700"
            >
              Clear
            </button>
          </div>

          {selected.isFree && (
            <p className="text-xs bg-jungle-50 border border-jungle-200 rounded-lg px-3 py-2 mb-4 text-jungle-700">
              This video is free — no purchase is needed for anyone to access it. Grant is
              typically a no-op here.
            </p>
          )}

          {/* Grant UI */}
          <div className="border-t border-stone-100 pt-4">
            <h4 className="text-sm font-bold text-stone-900 mb-2">Grant access to a user</h4>
            <input
              type="text"
              value={userQuery}
              onChange={(e) => doUserSearch(e.target.value)}
              placeholder="Search by name, username, or email..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:border-jungle-500 focus:outline-none"
            />
            {userResults.length > 0 && (
              <ul className="mt-2 border border-stone-200 rounded-lg divide-y divide-stone-100 max-h-60 overflow-y-auto">
                {userResults.map((u) => (
                  <li key={u.userId} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {u.displayName ?? u.email}
                      </p>
                      <p className="text-xs text-stone-500 truncate">
                        {u.username && <>@{u.username} · </>}
                        {u.email} · {u.role}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => grant(u.userId)}
                      disabled={isPending}
                      className="shrink-0 bg-jungle-600 hover:bg-jungle-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      Grant
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {actionError && <p className="text-sm text-red-600 mt-2">{actionError}</p>}
            {actionOk && <p className="text-sm text-jungle-700 mt-2">{actionOk}</p>}
          </div>

          {/* Current access list */}
          <div className="border-t border-stone-100 pt-4 mt-5">
            <h4 className="text-sm font-bold text-stone-900 mb-2">Current access</h4>
            {listError && <p className="text-sm text-red-600">{listError}</p>}
            {!listError && entries.length === 0 ? (
              <p className="text-sm text-stone-400">No purchase or grant rows for this video.</p>
            ) : (
              <ul className="border border-stone-200 rounded-lg divide-y divide-stone-100">
                {entries.map((e) => (
                  <li key={e.purchaseId} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex items-center gap-2">
                      <KindBadge kind={e.kind} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900 truncate">
                          {e.userDisplayName ?? e.userEmail}
                        </p>
                        <p className="text-xs text-stone-500 truncate">
                          {e.userUsername && <>@{e.userUsername} · </>}
                          {e.userEmail}
                          {e.kind === 'paid' && e.amountPaid > 0 && <> · ${e.amountPaid.toFixed(2)} ({e.tier})</>}
                          {e.kind === 'share' && e.expiresAt && (
                            <> · expires {new Date(e.expiresAt).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                    </div>
                    {e.kind === 'admin_grant' && (
                      <button
                        type="button"
                        onClick={() => revoke(e.userId)}
                        disabled={isPending}
                        className="shrink-0 text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1 disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-stone-400 mt-3 leading-relaxed">
              Only admin-granted rows can be revoked here. Real paid purchases need to be refunded
              through Stripe; share redemptions expire on their own after 30 days.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

function KindBadge({ kind }: { kind: VideoAccessEntry['kind'] }) {
  const styles: Record<VideoAccessEntry['kind'], string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    share: 'bg-blue-100 text-blue-700',
    admin_grant: 'bg-amber-100 text-amber-700',
  }
  const labels: Record<VideoAccessEntry['kind'], string> = {
    paid: 'Paid',
    share: 'Share',
    admin_grant: 'Admin',
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${styles[kind]}`}>
      {labels[kind]}
    </span>
  )
}
