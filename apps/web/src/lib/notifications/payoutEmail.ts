// Stub email notifier for creator payouts.
//
// JungleGym does not have an email provider wired up yet — this scaffolding
// captures the call sites and payload shape so swapping in a real sender
// (Resend / Postmark / SES — TBD) is a single-file change.
//
// Until that day, every call here logs a [payout-email PENDING] line. To
// spot-check what would have gone out: `wrangler tail junglegym`.
//
// See docs/external-services-todo.md → "Transactional email service".

type PayoutEmailPayload = {
  creatorEmail: string
  creatorName: string
  amountPaid: number
  fee: number
  grossAmount: number
  giftCount: number
  mode: 'scheduled' | 'pull'
  transferId: string
}

export async function sendPayoutNotification(payload: PayoutEmailPayload): Promise<void> {
  // Real implementation goes here once the email service is set up.
  // Do NOT throw — payout flows must succeed even if the notification path
  // is broken. The payout itself is the load-bearing operation; the email
  // is a courtesy.
  console.warn('[payout-email PENDING]', JSON.stringify(payload))
}
