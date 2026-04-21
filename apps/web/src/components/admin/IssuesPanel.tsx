'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

  if (issues.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-bold text-stone-900 mb-4">Issues</h2>
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
          <p className="text-3xl mb-2">✨</p>
          <p className="text-sm text-stone-500">No open issues</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
        Issues
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

                <button
                  onClick={() => handleRetry(issue.videoId)}
                  disabled={retrying[issue.videoId]}
                  className="shrink-0 text-sm font-semibold px-3 py-1.5 rounded-lg bg-jungle-600 hover:bg-jungle-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {retrying[issue.videoId] ? 'Retrying…' : 'Retry'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
