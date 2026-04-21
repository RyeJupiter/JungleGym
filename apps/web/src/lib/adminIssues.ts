// Helper for writing to the admin_issues table. Call this from anywhere
// in server-side code when something goes wrong that an admin needs to
// see on /admin?tab=issues.
//
// Never throws — the caller is almost always in an error path already,
// and a failed issue insert shouldn't mask the original problem. We log
// to stderr if the insert fails.

import { createServiceSupabaseClient } from '@/lib/supabase/server'

export type IssueSeverity = 'info' | 'warning' | 'error'

export type RecordIssueInput = {
  /** Stable machine id, e.g. 'stripe_dispute', 'payout_failed'. */
  kind: string
  severity?: IssueSeverity
  title: string
  description?: string
  /** Arbitrary structured detail for the panel to render. */
  context?: Record<string, unknown>
}

export async function recordAdminIssue(input: RecordIssueInput): Promise<void> {
  try {
    const svc = createServiceSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (svc as any).from('admin_issues').insert({
      kind: input.kind,
      severity: input.severity ?? 'warning',
      title: input.title,
      description: input.description ?? null,
      context: input.context ?? {},
    })
    if (error) {
      console.error('[adminIssues] insert failed:', error.message, '-', input.kind)
    }
  } catch (err) {
    console.error('[adminIssues] insert threw:', err)
  }
}
