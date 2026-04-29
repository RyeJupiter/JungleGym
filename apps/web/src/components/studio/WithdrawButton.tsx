'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  available: number              // unsettled gross balance, dollars
  pullFee: number                // fee that would be carved if pulled now, dollars
  pullAmountPaid: number         // amount creator would receive
  minAmount: number              // min payout threshold
  rateLimitedUntil: string | null // ISO; null if eligible
  notConnected: boolean
}

export function WithdrawButton({
  available,
  pullFee,
  pullAmountPaid,
  minAmount,
  rateLimitedUntil,
  notConnected,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const belowMin = available < minAmount
  const rateLimited = rateLimitedUntil !== null && new Date(rateLimitedUntil) > new Date()
  const disabled = belowMin || rateLimited || notConnected

  let disabledReason: string | null = null
  if (notConnected) disabledReason = 'Connect Stripe in Settings to withdraw.'
  else if (belowMin) disabledReason = `Minimum withdrawal is $${minAmount.toFixed(2)}.`
  else if (rateLimited && rateLimitedUntil) {
    const next = new Date(rateLimitedUntil)
    disabledReason = `Next pull available ${next.toLocaleDateString()}.`
  }

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/payouts/withdraw', { method: 'POST' })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setError(json?.message ?? json?.error ?? 'Withdrawal failed')
        setSubmitting(false)
        return
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="bg-jungle-600 hover:bg-jungle-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Withdraw now
        </button>
        {disabledReason && (
          <p className="text-xs text-stone-500">{disabledReason}</p>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-stone-900 mb-3">Withdraw to your bank?</h3>
            <dl className="space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <dt className="text-stone-500">Available</dt>
                <dd className="text-stone-900 font-medium">${available.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Fee (5%)</dt>
                <dd className="text-stone-700">−${pullFee.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2">
                <dt className="text-stone-900 font-semibold">You receive</dt>
                <dd className="text-stone-900 font-semibold">${pullAmountPaid.toFixed(2)}</dd>
              </div>
            </dl>
            <p className="text-xs text-stone-500 mb-4">
              Or wait for the monthly payout — Stripe&apos;s standard 2.9% + $0.30 processing fee instead of 5%.
            </p>
            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="flex-1 bg-white hover:bg-stone-50 text-stone-700 font-semibold px-4 py-2 rounded-lg text-sm border border-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 bg-jungle-600 hover:bg-jungle-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {submitting ? 'Sending…' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
