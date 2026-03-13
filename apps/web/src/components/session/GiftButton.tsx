'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { calculateGiftTotal, formatPrice } from '@junglegym/shared'

export function GiftButton({
  sessionId,
  creatorName,
}: {
  sessionId: string
  creatorName: string
}) {
  const [open, setOpen] = useState(false)
  const [creatorAmount, setCreatorAmount] = useState('')
  const [tipPct, setTipPct] = useState(10)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createBrowserSupabaseClient()

  const rawCreator = parseFloat(creatorAmount) || 0
  const { platformAmount, total } = calculateGiftTotal(rawCreator, tipPct)

  async function handleSend() {
    if (rawCreator <= 0) return
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const { error } = await supabase.from('gifts').insert({
        session_id: sessionId,
        giver_id: session.user.id,
        creator_amount: rawCreator,
        platform_tip_pct: tipPct,
        platform_amount: platformAmount,
        total_amount: total,
        message: message || null,
      })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => { setOpen(false); setSuccess(false) }, 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send gift')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-jungle-600 hover:bg-jungle-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
      >
        🎁 Send a gift
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl">
            {success ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">💚</div>
                <p className="font-bold text-jungle-800 text-lg">Gift sent!</p>
                <p className="text-stone-500 text-sm mt-1">Thank you for your generosity.</p>
              </div>
            ) : (
              <>
                <h3 className="font-black text-stone-900 text-lg mb-1">Send a gift</h3>
                <p className="text-stone-500 text-sm mb-6">
                  100% of your gift goes directly to {creatorName}.
                </p>

                {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Gift to {creatorName}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={creatorAmount}
                      onChange={(e) => setCreatorAmount(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 pl-7 pr-3 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-jungle-400"
                      placeholder="20"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Platform tip: {tipPct}%
                    <span className="text-stone-400 font-normal ml-1">(adjustable — even 0%)</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={tipPct}
                    onChange={(e) => setTipPct(Number(e.target.value))}
                    className="w-full accent-jungle-600"
                  />
                  <div className="flex justify-between text-xs text-stone-400 mt-1">
                    <span>0%</span>
                    <span>10%</span>
                    <span>30%</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Message (optional)
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400"
                    placeholder="This session was amazing!"
                  />
                </div>

                {rawCreator > 0 && (
                  <div className="bg-stone-50 rounded-xl p-4 text-sm mb-4 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-stone-600">To {creatorName}</span>
                      <span className="font-bold text-jungle-800">{formatPrice(rawCreator)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Platform tip ({tipPct}%)</span>
                      <span className="text-stone-500">{formatPrice(platformAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-stone-200 pt-1 mt-1">
                      <span className="font-semibold">You pay</span>
                      <span className="font-black">{formatPrice(total)}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={loading || rawCreator <= 0}
                    className="flex-1 bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send gift'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
