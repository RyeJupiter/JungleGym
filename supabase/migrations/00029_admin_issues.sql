-- ============================================================
-- JungleGym – Admin issues (dismissable) + generic issues table
-- ============================================================
-- Two additions:
--
-- 1. videos.transcript_issue_dismissed_at — per-video dismissal for the
--    existing transcript-failure + stuck-pending issues shown on
--    /admin?tab=issues. Dismiss hides the row until the underlying
--    state changes (a retry clears it so new failures resurface).
--
-- 2. admin_issues — generic table for everything else that could need
--    an admin's attention: Stripe disputes, refunds, failed payouts,
--    webhook handler errors, anything future code wants to surface.
--    Writers call recordAdminIssue() from lib/adminIssues.ts.

ALTER TABLE public.videos
  ADD COLUMN transcript_issue_dismissed_at timestamptz;

CREATE TABLE public.admin_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stable machine id for the issue type (e.g. 'stripe_dispute',
  -- 'payout_failed', 'webhook_handler_error'). Used for grouping +
  -- potential future deduplication.
  kind text NOT NULL,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','error')),
  title text NOT NULL,
  description text,
  -- Arbitrary structured detail — e.g. { paymentIntent: 'pi_xxx', amount: 25.00 }
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  dismissed_at timestamptz,
  -- Email of the admin who dismissed. No FK — we keep it even if the
  -- admin is later removed from site_admins.
  dismissed_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_issues_open_idx
  ON public.admin_issues (created_at DESC)
  WHERE dismissed_at IS NULL;

-- Lock the table to service-role only. Admin reads + dismissals all
-- go through server actions that use the service client. No policies
-- defined means no access from the anon/authenticated roles.
ALTER TABLE public.admin_issues ENABLE ROW LEVEL SECURITY;
