'use client'

import { useState } from 'react'

type Props = {
  kind: 'bio' | 'description'
  current: string
  context?: Record<string, string | string[] | number | null | undefined>
  onAccept: (next: string) => void
  className?: string
}

/**
 * "Polish with AI" button.
 * Fetches a suggested longer version from Groq via /api/polish, shows a diff-style
 * preview, and lets the creator accept, edit, or dismiss. Never replaces text silently.
 */
export function PolishButton({ kind, current, context, onAccept, className }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [edited, setEdited] = useState<string>('')

  async function handleClick() {
    setLoading(true)
    setError(null)
    setSuggestion(null)
    try {
      const res = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, current, context }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate suggestion')
      setSuggestion(data.suggestion)
      setEdited(data.suggestion)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestion')
    } finally {
      setLoading(false)
    }
  }

  function handleAccept() {
    if (edited.trim()) onAccept(edited.trim())
    setSuggestion(null)
    setEdited('')
    setError(null)
  }

  function handleDismiss() {
    setSuggestion(null)
    setEdited('')
    setError(null)
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-jungle-50 hover:bg-jungle-100 text-jungle-700 border border-jungle-200 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Polishing…
            </>
          ) : (
            <>
              <span aria-hidden>✨</span>
              {current.trim() ? `Polish ${kind} with AI` : `Draft ${kind} with AI`}
            </>
          )}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      {suggestion && (
        <div className="mt-3 bg-jungle-50/60 border border-jungle-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-jungle-700 uppercase tracking-wide">
              AI suggestion — review before accepting
            </p>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              Dismiss
            </button>
          </div>
          <textarea
            value={edited}
            onChange={(e) => setEdited(e.target.value)}
            rows={kind === 'bio' ? 6 : 5}
            className="w-full rounded-lg border border-jungle-200 bg-white px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-jungle-400"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleAccept}
              className="bg-jungle-600 hover:bg-jungle-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              Use this {kind}
            </button>
            <button
              type="button"
              onClick={handleClick}
              disabled={loading}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
