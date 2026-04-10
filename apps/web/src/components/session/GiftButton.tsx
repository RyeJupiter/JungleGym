'use client'

import { useState, useEffect, useRef } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { calculatePriceBreakdown, formatPrice, PLATFORM_FEE_PCT } from '@junglegym/shared'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function GiftButton({
  sessionId,
  creatorName,
  suggestedTip = 5,
}: {
  sessionId: string
  creatorName: string
  suggestedTip?: number
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(String(suggestedTip))
  const [message, setMessage] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedAmountRef = useRef<number | null>(null)

  const rawAmount = parseFloat(amount) || 0
  const { creatorAmount, platformFee, total } = calculatePriceBreakdown(rawAmount)

  // Auto-create PaymentIntent when amount changes (debounced)
  useEffect(() => {
    if (!open || rawAmount <= 0 || fetchedAmountRef.current === rawAmount) return

    const timeout = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/checkout/gift', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, amount: rawAmount, message }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to start payment')
        setClientSecret(data.clientSecret)
        fetchedAmountRef.current = rawAmount
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to start payment')
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [open, rawAmount, sessionId, message])

  function handleAmountChange(val: string) {
    setAmount(val)
    // Reset so a new intent is created for the new amount
    if (clientSecret) {
      setClientSecret(null)
      fetchedAmountRef.current = null
    }
  }

  function handleClose() {
    setOpen(false)
    setClientSecret(null)
    setSuccess(false)
    setError(null)
    setAmount(String(suggestedTip))
    setMessage('')
    fetchedAmountRef.current = null
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
          {success ? (
            <div className="animate-gift-success text-center pointer-events-none">
              <div className="text-6xl mb-2">💚</div>
              <p className="font-black text-white text-xl drop-shadow-lg">Gift sent!</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl max-h-[90vh] overflow-y-auto">
              <h3 className="font-black text-stone-900 text-lg mb-1">Send a gift</h3>
              <p className="text-stone-500 text-sm mb-5">
                80% goes to {creatorName}. {PLATFORM_FEE_PCT}% platform fee.
              </p>

              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

              {/* Amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-1">Gift amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 pl-7 pr-3 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-jungle-400"
                    placeholder="20"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-1">Message (optional)</label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400"
                  placeholder="This session was amazing!"
                />
              </div>

              {/* Price breakdown */}
              {rawAmount > 0 && (
                <div className="bg-stone-50 rounded-xl p-4 text-sm mb-4 space-y-1">
                  <div className="flex justify-between font-black border-b border-stone-200 pb-1 mb-1">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">To {creatorName} (80%)</span>
                    <span className="font-bold text-jungle-800">{formatPrice(creatorAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Platform fee ({PLATFORM_FEE_PCT}%)</span>
                    <span className="text-stone-500">{formatPrice(platformFee)}</span>
                  </div>
                </div>
              )}

              {/* Inline payment */}
              {clientSecret ? (
                <div className="mb-4">
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#16a34a',
                          borderRadius: '12px',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                        },
                      },
                    }}
                  >
                    <GiftPaymentForm
                      sessionId={sessionId}
                      creatorAmount={creatorAmount}
                      platformFee={platformFee}
                      total={total}
                      message={message}
                      onSuccess={() => {
                        setSuccess(true)
                        setTimeout(handleClose, 1500)
                      }}
                      onError={(msg) => setError(msg)}
                    />
                  </Elements>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-6">
                  <svg className="animate-spin w-5 h-5 text-jungle-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                </div>
              ) : null}

              <button
                onClick={handleClose}
                className="w-full text-stone-400 hover:text-stone-600 text-sm transition-colors mt-2"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes giftPop {
          0% { opacity: 0; transform: scale(0.5); }
          40% { opacity: 1; transform: scale(1.15); }
          70% { transform: scale(0.95); }
          100% { opacity: 0; transform: scale(1) translateY(-20px); }
        }
        .animate-gift-success {
          animation: giftPop 1.5s ease-out forwards;
        }
      `}</style>
    </>
  )
}

function GiftPaymentForm({
  sessionId,
  creatorAmount,
  platformFee,
  total,
  message,
  onSuccess,
  onError,
}: {
  sessionId: string
  creatorAmount: number
  platformFee: number
  total: number
  message: string
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const supabase = createBrowserSupabaseClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    onError('')

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (stripeError) {
      onError(stripeError.message ?? 'Payment failed. Please try again.')
      setProcessing(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('gifts').insert({
            session_id: sessionId,
            giver_id: user.id,
            creator_amount: creatorAmount,
            platform_tip_pct: PLATFORM_FEE_PCT,
            platform_amount: platformFee,
            total_amount: total,
            message: message || null,
          })
        }
      } catch {
        // Payment succeeded even if DB insert fails
      }
      onSuccess()
    } else {
      onError('Payment was not completed. Please try again.')
    }

    setProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
      >
        {processing ? 'Processing...' : `Send ${formatPrice(total)} gift`}
      </button>
    </form>
  )
}
