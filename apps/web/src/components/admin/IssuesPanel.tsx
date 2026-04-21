'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { dismissTranscriptIssue } from '@/app/admin/actions'

export type TranscriptIssue = {
  videoId: string
  title: string
  creatorName: string | null
  creatorUsername: string | null
  status: 'failed' | 'stuck'
  error: string | null
  attempts: number
  updatedAt: string
}

export function IssuesPanel({ issues }: { issues: TranscriptIssue[] }) {
  const router = useRouter()
  const [retrying, setRetrying] = useState<Record<string, boolean>>({})
  const [dismissing, setDismissing] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleRetry(videoId: string) {
    setRetrying((r) => ({ ...r, [videoId]: true }))
    setErrors((e) => {
      const next = { ...e }
      delete next[videoId]
      return next
    })
    try {
      const res = await fetch(`/api/transcribe/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Empty body — the route will list audio chunks from storage.
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      // Give Groq ~6s to finish a single-chunk transcription before
      // refreshing — typical is 2–4s.
      setTimeout(() => router.refresh(), 6000)
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [videoId]: err instanceof Error ? err.message : 'Retry failed',
      }))
      setRetrying((r) => ({ ...r, [videoId]: false }))
    }
  }

  async function handleDismiss(videoId: string) {
    setDismissing((d) => ({ ...d, [videoId]: true }))
    const result = await dismissTranscriptIssue(videoId)
    if (result.error) {
      setErrors((e) => ({ ...e, [videoId]: result.error! }))
      setDismissing((d) => ({ ...d, [videoId]: false }))
      return
    }
    router.refresh()
  }

  // Empty state is owned by the parent (AdminContent) so it can render
  // a single consolidated "no issues" panel covering both this section
  // and GenericIssuesPanel.
  if (issues.length === 0) return null

  return (
    <section>
      <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
        Transcription issues
        <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
          {issues.length}
        </span>
      </h2>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h3 className="text-sm font-bold text-stone-900">Failed transcriptions</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Videos where auto-transcription failed after one retry. Click Retry to
            try again — it will re-use the audio chunks the creator&apos;s browser
            already uploaded.
          </p>
        </div>

        <ul className="divide-y divide-stone-100">
          {issues.map((issue) => (
            <li key={issue.videoId} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                      issue.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {issue.status === 'failed' ? 'Failed' : 'Stuck'}
                    </span>
                    <Link
                      href={`/video/${issue.videoId}`}
                      target="_blank"
                      className="text-sm font-semibold text-stone-900 hover:text-jungle-600 transition-colors truncate"
                    >
                      {issue.title}
                    </Link>
                  </div>
                  <p className="text-xs text-stone-500">
                    {issue.creatorName ?? 'Unknown creator'}
                    {issue.creatorUsername && (
                      <>
                        {' · '}
                        <Link href={`/@${issue.creatorUsername}`} target="_blank" className="hover:text-jungle-600">
                          @{issue.creatorUsername}
                        </Link>
                      </>
                    )}
                    {' · '}
                    {issue.attempts} attempt{issue.attempts === 1 ? '' : 's'}
                  </p>
                  {issue.error && (
                    <p className="mt-1.5 text-xs text-red-600 font-mono break-all">
                      {issue.error}
                    </p>
                  )}
                  {errors[issue.videoId] && (
                    <p className="mt-1.5 text-xs text-red-600">
                      Retry failed: {errors[issue.videoId]}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleRetry(issue.videoId)}
                    disabled={retrying[issue.videoId] || dismissing[issue.videoId]}
                    className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-jungle-600 hover:bg-jungle-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {retrying[issue.videoId] ? 'Retrying…' : 'Retry'}
                  </button>
                  <button
                    onClick={() => handleDismiss(issue.videoId)}
                    disabled={dismissing[issue.videoId] || retrying[issue.videoId]}
                    aria-label="Dismiss"
                    title="Dismiss (hide until this video's transcript state changes)"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
