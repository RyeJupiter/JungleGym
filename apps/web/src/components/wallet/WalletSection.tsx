'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { formatPrice, calculateTopUpTotal, WALLET_TOPUP_FEE_PCT } from '@junglegym/shared'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function WalletSection({ initialBalance }: { initialBalance: number }) {
  const [balance, setBalance] = useState(initialBalance)
  const [showTopUp, setShowTopUp] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState(25)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { fee, chargeTotal } = calculateTopUpTotal(selectedAmount)

  async function handleStartPayment() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedAmount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start payment')
      setClientSecret(data.clientSecret)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start payment')
    } finally {
      setLoading(false)
    }
  }

  function handleTopUpComplete(newBalance: number) {
    setBalance(newBalance)
    setClientSecret(null)
    setShowTopUp(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  function handleCancel() {
    setShowTopUp(false)
    setClientSecret(null)
    setError(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-4">
      <div>
        <h2 className="font-bold text-stone-900">Wallet</h2>
        <p className="text-sm text-stone-400 mt-0.5">
          Pre-load funds to send instant gifts during live sessions.
        </p>
      </div>

      {success && (
        <p className="bg-jungle-50 text-jungle-700 rounded-lg px-4 py-3 text-sm">
          Wallet funded successfully!
        </p>
      )}
      {error && (
        <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>
      )}

      {/* Balance display */}
      <div className="bg-stone-50 rounded-xl px-6 py-5 flex items-center justify-between">
        <span className="text-stone-600 font-medium">Balance</span>
        <span className="text-2xl font-black text-stone-900">{formatPrice(balance)}</span>
      </div>

      {!showTopUp ? (
        <button
          onClick={() => setShowTopUp(true)}
          className="w-full border border-stone-200 text-stone-700 font-medium py-3 rounded-xl hover:bg-stone-50 transition-colors"
        >
          Add funds
        </button>
      ) : !clientSecret ? (
        <div className="space-y-4">
          {/* Amount presets */}
          <div className="grid grid-cols-3 gap-2">
            {[10, 25, 50].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSelectedAmount(v)}
                className={`py-3 rounded-xl text-sm font-bold transition-colors ${
                  selectedAmount === v
                    ? 'bg-jungle-600 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                ${v}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div>
            <label className="block text-xs text-stone-500 mb-1">Or enter a custom amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
              <input
                type="number"
                min="1"
                max="500"
                step="1"
                value={selectedAmount}
                onChange={(e) => setSelectedAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg border border-stone-200 pl-7 pr-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400"
              />
            </div>
          </div>

          {/* Fee breakdown */}
          <div className="bg-stone-50 rounded-xl p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-600">Wallet credit</span>
              <span className="font-bold text-jungle-800">{formatPrice(selectedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Service fee ({WALLET_TOPUP_FEE_PCT}%)</span>
              <span className="text-stone-500">{formatPrice(fee)}</span>
            </div>
            <div className="flex justify-between font-black border-t border-stone-200 pt-1 mt-1">
              <span>You pay</span>
              <span>{formatPrice(chargeTotal)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 border border-stone-200 text-stone-500 font-medium py-2.5 rounded-xl hover:bg-stone-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleStartPayment}
              disabled={loading}
              className="flex-1 bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Loading...' : `Pay ${formatPrice(chargeTotal)}`}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
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
            <WalletPaymentForm
              chargeTotal={chargeTotal}
              onComplete={handleTopUpComplete}
              onError={(msg) => setError(msg)}
            />
          </Elements>
          <button
            onClick={handleCancel}
            className="w-full text-stone-400 hover:text-stone-600 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      <p className="text-xs text-stone-400 text-center">
        Wallet funds are used for live session gifts. A {WALLET_TOPUP_FEE_PCT}% service fee covers payment processing.
      </p>
    </div>
  )
}

function WalletPaymentForm({
  chargeTotal,
  onComplete,
  onError,
}: {
  chargeTotal: number
  onComplete: (newBalance: number) => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (stripeError) {
      onError(stripeError.message ?? 'Payment failed')
      setProcessing(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        const res = await fetch('/api/wallet/topup/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to credit wallet')
        onComplete(data.balance)
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Payment succeeded but wallet credit failed')
      }
    } else {
      onError('Payment was not completed')
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
        {processing ? 'Processing...' : `Pay ${formatPrice(chargeTotal)}`}
      </button>
    </form>
  )
}
