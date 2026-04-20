'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveApplication, rejectApplication } from '@/app/admin/actions'
import { movementLabel } from '@/lib/movement-types'

export type AdminApplication = {
  id: string
  user_id: string
  motivation: string | null
  instagram_url: string | null
  youtube_url: string | null
  movement_types: string[]
  other_movement: string | null
  demoVideoSignedUrl: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
  applicant: {
    display_name: string | null
    username: string | null
    email: string | null
    photo_url: string | null
  } | null
  reviewer: {
    display_name: string | null
    email: string | null
  } | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatusPill({ status }: { status: AdminApplication['status'] }) {
  const cls =
    status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
    status === 'approved' ? 'bg-green-50 text-green-700' :
    'bg-red-50 text-red-600'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${cls}`}>
      {status}
    </span>
  )
}

function Avatar({ photoUrl, displayName }: { photoUrl: string | null; displayName: string | null }) {
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-jungle-100 flex-shrink-0 flex items-center justify-center text-sm font-semibold text-jungle-600">
      {photoUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={photoUrl} alt={displayName ?? ''} className="w-full h-full object-cover" />
        : <span>🌿</span>}
    </div>
  )
}

function MovementChips({ slugs, other, compact = false }: { slugs: string[]; other: string | null; compact?: boolean }) {
  const labels = slugs.map(movementLabel)
  if (other) labels.push(other)
  if (labels.length === 0) {
    return <span className="text-xs text-stone-400 italic">No movement types listed</span>
  }
  const shown = compact ? labels.slice(0, 3) : labels
  const extra = compact ? labels.length - shown.length : 0
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((label) => (
        <span
          key={label}
          className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full"
        >
          {label}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-xs text-stone-400 px-1 py-0.5">+{extra} more</span>
      )}
    </div>
  )
}

export function ApplicationCard({
  app: initial,
  readOnly = false,
}: {
  app: AdminApplication
  readOnly?: boolean
}) {
  const [app, setApp] = useState(initial)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const displayName = app.applicant?.display_name ?? 'Unknown'
  const username = app.applicant?.username
  const email = app.applicant?.email

  function approve() {
    setError(null)
    startTransition(async () => {
      const result = await approveApplication(app.id, app.user_id)
      if (result.error) {
        setError(result.error)
      } else {
        setApp((prev) => ({ ...prev, status: 'approved', reviewed_at: new Date().toISOString() }))
        router.refresh()
      }
    })
  }

  function reject() {
    setError(null)
    startTransition(async () => {
      const result = await rejectApplication(app.id)
      if (result.error) {
        setError(result.error)
      } else {
        setApp((prev) => ({ ...prev, status: 'rejected', reviewed_at: new Date().toISOString() }))
        router.refresh()
      }
    })
  }

  const isPendingStatus = app.status === 'pending' && !readOnly
  const hasAnyDetail =
    app.motivation || app.instagram_url || app.youtube_url || app.demoVideoSignedUrl || app.other_movement

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      {/* ── Compact row ──────────────────────────────────────────────────
          Using a div with role=button instead of a real <button> so we
          can nest real action buttons inside (Approve/Reject) without
          producing invalid HTML. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setExpanded((v) => !v)
          }
        }}
        aria-expanded={expanded}
        className="cursor-pointer hover:bg-stone-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400"
      >
        <div className="px-5 py-4 flex items-center gap-4">
          <Avatar photoUrl={app.applicant?.photo_url ?? null} displayName={displayName} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-stone-900 truncate">{displayName}</p>
              {username && <span className="text-xs text-stone-400">@{username}</span>}
              {app.status !== 'pending' && <StatusPill status={app.status} />}
            </div>
            <div className="mt-1.5">
              <MovementChips slugs={app.movement_types} other={app.other_movement} compact />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isPendingStatus && (
              <>
                <QuickButton
                  onClick={(e) => { e.stopPropagation(); approve() }}
                  disabled={isPending}
                  variant="approve"
                >
                  {isPending ? '…' : 'Approve'}
                </QuickButton>
                <QuickButton
                  onClick={(e) => { e.stopPropagation(); reject() }}
                  disabled={isPending}
                  variant="reject"
                >
                  Reject
                </QuickButton>
              </>
            )}
            <span className={`text-stone-400 text-sm transition-transform ${expanded ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </div>
        </div>
      </div>

      {/* ── Expanded panel ─────────────────────────────────────────────── */}
      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-stone-100 space-y-5">
          {error && (
            <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400" suppressHydrationWarning>
            {email && <span>{email}</span>}
            <span>·</span>
            <span>Applied {formatDate(app.created_at)}</span>
            {app.reviewed_at && (
              <>
                <span>·</span>
                <span>
                  {app.status === 'approved' ? 'Approved' : 'Rejected'} {formatDate(app.reviewed_at)}
                  {app.reviewer?.display_name && (
                    <> by <span className="text-stone-600 font-medium">{app.reviewer.display_name}</span></>
                  )}
                </span>
              </>
            )}
          </div>

          {/* Movement types (full) */}
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Movement
            </p>
            <MovementChips slugs={app.movement_types} other={app.other_movement} />
          </div>

          {/* Motivation */}
          {app.motivation && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Motivation
              </p>
              <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 rounded-xl px-4 py-3 whitespace-pre-wrap">
                {app.motivation}
              </p>
            </div>
          )}

          {/* Links */}
          {(app.instagram_url || app.youtube_url) && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Links
              </p>
              <div className="space-y-1.5">
                {app.instagram_url && (
                  <a
                    href={app.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-jungle-700 hover:text-jungle-500 transition-colors break-all"
                  >
                    Instagram → {app.instagram_url}
                  </a>
                )}
                {app.youtube_url && (
                  <a
                    href={app.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-jungle-700 hover:text-jungle-500 transition-colors break-all"
                  >
                    YouTube → {app.youtube_url}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Demo video */}
          {app.demoVideoSignedUrl && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Demo video
              </p>
              <video
                src={app.demoVideoSignedUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-xl bg-stone-900 aspect-video"
              />
            </div>
          )}

          {!hasAnyDetail && (
            <p className="text-sm text-stone-400 italic">No additional details provided.</p>
          )}

          {/* Big decision buttons — pending only */}
          {isPendingStatus && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={approve}
                disabled={isPending}
                className="flex-1 bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {isPending ? 'Working…' : 'Approve application'}
              </button>
              <button
                onClick={reject}
                disabled={isPending}
                className="flex-1 bg-white hover:bg-red-50 text-red-600 font-bold py-3 rounded-xl border border-red-200 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function QuickButton({
  onClick,
  disabled,
  variant,
  children,
}: {
  onClick: (e: React.MouseEvent) => void
  disabled: boolean
  variant: 'approve' | 'reject'
  children: React.ReactNode
}) {
  const cls = variant === 'approve'
    ? 'bg-jungle-600 hover:bg-jungle-700 text-white'
    : 'bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  )
}
