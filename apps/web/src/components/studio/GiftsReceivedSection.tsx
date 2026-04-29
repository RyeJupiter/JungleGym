import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  PAYOUT_MIN_AMOUNT,
  PAYOUT_PULL_FEE_PCT,
  PAYOUT_PULL_RATE_LIMIT_DAYS,
  PAYOUT_SCHEDULED_FEE,
  calculatePullPayout,
} from '@junglegym/shared'
import { WithdrawButton } from './WithdrawButton'

type GiftRow = {
  creator_amount: number | string
  settled_at: string | null
}

type RecentPayout = {
  id: string
  amount_paid: number | string
  fee: number | string
  gift_count: number
  mode: 'scheduled' | 'pull'
  status: 'pending' | 'paid' | 'failed' | 'reversed'
  created_at: string
  paid_at: string | null
}

export async function GiftsReceivedSection({ userId }: { userId: string }) {
  const supabase = await createServerSupabaseClient()

  // Pull lifetime gross + unsettled balance from gifts in one go.
  // Pull most-recent pull payout for rate-limit display.
  // Pull recent payout history for the settlement list.
  const [{ data: gifts }, { data: profile }, { data: lastPull }, { data: recentPayouts }] = await Promise.all([
    supabase
      .from('gifts')
      .select('creator_amount, settled_at')
      .eq('creator_id', userId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('user_id', userId)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('creator_payouts')
      .select('created_at')
      .eq('creator_id', userId)
      .eq('mode', 'pull')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('creator_payouts')
      .select('id, amount_paid, fee, gift_count, mode, status, created_at, paid_at')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const giftRows = (gifts ?? []) as GiftRow[]
  const lifetime = giftRows.reduce((sum, g) => {
    const a = typeof g.creator_amount === 'string' ? Number(g.creator_amount) : g.creator_amount
    return Math.round((sum + a) * 100) / 100
  }, 0)
  const unsettled = giftRows
    .filter((g) => g.settled_at === null)
    .reduce((sum, g) => {
      const a = typeof g.creator_amount === 'string' ? Number(g.creator_amount) : g.creator_amount
      return Math.round((sum + a) * 100) / 100
    }, 0)

  const { fee: pullFee, amountPaid: pullAmountPaid } = calculatePullPayout(unsettled)

  const notConnected = !profile?.stripe_account_id || !profile?.stripe_onboarding_complete

  let rateLimitedUntil: string | null = null
  if (lastPull?.created_at) {
    const next = new Date(new Date(lastPull.created_at).getTime() + PAYOUT_PULL_RATE_LIMIT_DAYS * 24 * 60 * 60 * 1000)
    if (next > new Date()) rateLimitedUntil = next.toISOString()
  }

  const payouts = (recentPayouts ?? []) as RecentPayout[]

  // No gifts ever and nothing pending — collapse the section so it doesn't
  // distract creators who haven't done a live session yet.
  if (giftRows.length === 0 && payouts.length === 0) {
    return null
  }

  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-stone-900 mb-4">Gifts received</h2>
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">Available to withdraw</p>
            <p className="text-3xl font-black text-stone-900">${unsettled.toFixed(2)}</p>
            <p className="text-xs text-stone-500 mt-1">
              Lifetime received: ${lifetime.toFixed(2)}
            </p>
          </div>
          <WithdrawButton
            available={unsettled}
            pullFee={pullFee}
            pullAmountPaid={pullAmountPaid}
            minAmount={PAYOUT_MIN_AMOUNT}
            rateLimitedUntil={rateLimitedUntil}
            notConnected={notConnected}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-100">
          <div>
            <p className="text-xs text-stone-500">Monthly auto-payout</p>
            <p className="text-sm font-medium text-stone-800">
              Free after a flat ${PAYOUT_SCHEDULED_FEE} fee · 1st of each month
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Pull anytime</p>
            <p className="text-sm font-medium text-stone-800">
              {PAYOUT_PULL_FEE_PCT}% fee · once every {PAYOUT_PULL_RATE_LIMIT_DAYS} days
            </p>
          </div>
        </div>

        <p className="text-xs text-stone-500 mt-4 leading-relaxed">
          Wallet balance is for sending gifts to creators. Gifts you receive are tracked here separately and paid out monthly to your bank.
        </p>
      </div>

      {payouts.length > 0 && (
        <div className="border-t border-stone-100 bg-stone-50/50">
          <p className="text-xs uppercase tracking-wider text-stone-400 font-semibold px-5 sm:px-6 pt-4 pb-2">
            Recent payouts
          </p>
          <ul className="divide-y divide-stone-100">
            {payouts.map((p) => {
              const amount = typeof p.amount_paid === 'string' ? Number(p.amount_paid) : p.amount_paid
              const fee = typeof p.fee === 'string' ? Number(p.fee) : p.fee
              const date = new Date(p.paid_at ?? p.created_at).toLocaleDateString()
              return (
                <li key={p.id} className="px-5 sm:px-6 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-stone-900">${amount.toFixed(2)}</span>
                    <span className="text-stone-400 ml-2">· {p.mode === 'pull' ? 'Withdrew' : 'Auto-payout'}</span>
                    <span className="text-stone-400 ml-2">· {p.gift_count} {p.gift_count === 1 ? 'gift' : 'gifts'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-500">−${fee.toFixed(2)} fee</span>
                    <span className="text-xs text-stone-400">{date}</span>
                    {p.status !== 'paid' && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.status === 'reversed' ? 'bg-red-100 text-red-700' :
                        p.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {p.status}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      </div>
    </section>
  )
}
