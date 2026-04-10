'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { calculatePriceBreakdown, formatPrice, PLATFORM_FEE_PCT } from '@junglegym/shared'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function GiftButton({
  sessionId,
  creatorName,
}: {
  sessionId: string
  creatorName: string
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rawAmount = parseFloat(amount) || 0
  const { creatorAmount, platformFee, total } = calculatePriceBreakdown(rawAmount)

  async function handleContinue() {
    if (rawAmount <= 0) return
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start payment')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setClientSecret(null)
    setSuccess(false)
    setError(null)
    setAmount('')
    setMessage('')
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
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl max-h-[90vh] overflow-y-auto">
            {success ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">💚</div>
                <p className="font-bold text-jungle-800 text-lg">Gift sent!</p>
                <p className="text-stone-500 text-sm mt-1">Thank you for your generosity.</p>
              </div>
            ) : (
              <>
                <h3 className="font-black text-stone-900 text-lg mb-1">Send a gift</h3>
                <p className="text-stone-500 text-sm mb-5">
                  80% goes to {creatorName}. {PLATFORM_FEE_PCT}% platform fee.
                </p>

                {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

                {/* Amount + message */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Gift amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value); if (clientSecret) { setClientSecret(null) } }}
                      className="w-full rounded-lg border border-stone-200 pl-7 pr-3 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-jungle-400"
                      placeholder="20"
                    />
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

                {/* Payment section */}
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
                        onSuccess={() => setSuccess(true)}
                        onError={(msg) => setError(msg)}
                      />
                    </Elements>
                  </div>
                ) : (
                  <button
                    onClick={handleContinue}
                    disabled={loading || rawAmount <= 0}
                    className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 mb-3"
                  >
                    {loading ? 'Setting up...' : 'Continue to payment'}
                  </button>
                )}

                <button
                  onClick={handleClose}
                  className="w-full text-stone-400 hover:text-stone-600 text-sm transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
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
      // Record the gift in the database
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
        // Gift record failed but payment succeeded — not ideal but the payment went through
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
