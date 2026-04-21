'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { dismissAdminIssue } from '@/app/admin/actions'

export type AdminIssue = {
  id: string
  kind: string
  severity: 'info' | 'warning' | 'error'
  title: string
  description: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: Record<string, any>
  createdAt: string
}

const SEVERITY_STYLES: Record<AdminIssue['severity'], { badge: string; label: string }> = {
  info: { badge: 'bg-blue-100 text-blue-700', label: 'Info' },
  warning: { badge: 'bg-amber-100 text-amber-700', label: 'Warning' },
  error: { badge: 'bg-red-100 text-red-700', label: 'Error' },
}

export function GenericIssuesPanel({ issues }: { issues: AdminIssue[] }) {
  const router = useRouter()
  const [dismissing, setDismissing] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleDismiss(issueId: string) {
    setDismissing((d) => ({ ...d, [issueId]: true }))
    const result = await dismissAdminIssue(issueId)
    if (result.error) {
      setErrors((e) => ({ ...e, [issueId]: result.error! }))
      setDismissing((d) => ({ ...d, [issueId]: false }))
      return
    }
    router.refresh()
  }

  if (issues.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
        Other issues
        <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
          {issues.length}
        </span>
      </h2>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h3 className="text-sm font-bold text-stone-900">Payment, webhook, and platform issues</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Events from Stripe webhooks and other parts of the platform that need a
            human look. Dismissing hides the row; if the underlying condition recurs,
            a fresh issue will be recorded.
          </p>
        </div>

        <ul className="divide-y divide-stone-100">
          {issues.map((issue) => {
            const style = SEVERITY_STYLES[issue.severity]
            return (
              <li key={issue.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${style.badge}`}>
                        {style.label}
                      </span>
                      <span className="text-xs font-mono text-stone-400">{issue.kind}</span>
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {issue.title}
                      </p>
                    </div>
                    <p className="text-xs text-stone-500" suppressHydrationWarning>
                      {new Date(issue.createdAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </p>
                    {issue.description && (
                      <p className="mt-1.5 text-sm text-stone-700">{issue.description}</p>
                    )}
                    {issue.context && Object.keys(issue.context).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-stone-400 cursor-pointer hover:text-stone-600">
                          Context
                        </summary>
                        <pre className="mt-1 text-xs font-mono bg-stone-50 rounded px-2 py-1.5 overflow-x-auto">
                          {JSON.stringify(issue.context, null, 2)}
                        </pre>
                      </details>
                    )}
                    {errors[issue.id] && (
                      <p className="mt-1.5 text-xs text-red-600">
                        Dismiss failed: {errors[issue.id]}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDismiss(issue.id)}
                    disabled={dismissing[issue.id]}
                    aria-label="Dismiss"
                    title="Dismiss"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors shrink-0 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
                    </svg>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
