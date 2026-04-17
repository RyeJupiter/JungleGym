'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { formatPrice, calculateTopUpTotal, WALLET_TOPUP_FEE_PCT } from '@junglegym/shared'

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
  const [balance, setBalance] = useState<number | null>(null)
  const [amount, setAmount] = useState(String(suggestedTip))
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState<number | null>(null)

  const rawAmount = parseFloat(amount) || 0

  // Fetch balance when modal opens
  useEffect(() => {
    if (!open) return
    fetch('/api/wallet/balance')
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? 0))
      .catch(() => setBalance(0))
  }, [open])

  const needsTopUp = balance !== null && rawAmount > balance

  async function handleSendGift() {
    if (rawAmount <= 0) return
    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/wallet/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, amount: rawAmount, message }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'Insufficient balance') {
          setBalance(data.balance ?? 0)
          setShowTopUp(true)
          setSending(false)
          return
        }
        throw new Error(data.error ?? 'Failed to send gift')
      }

      setBalance(data.balance)
      setSuccess(true)
      setTimeout(handleClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send gift')
    } finally {
      setSending(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setSuccess(false)
    setError(null)
    setShowTopUp(false)
    setTopUpAmount(null)
    setAmount(String(suggestedTip))
    setMessage('')
  }

  function handleTopUpNeeded() {
    // Calculate minimum top-up needed (round up to nearest $5)
    const deficit = rawAmount - (balance ?? 0)
    const minTopUp = Math.max(10, Math.ceil(deficit / 5) * 5)
    setTopUpAmount(minTopUp)
    setShowTopUp(true)
  }

  function handleTopUpComplete(newBalance: number) {
    setBalance(newBalance)
    setShowTopUp(false)
    setTopUpAmount(null)
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
          ) : showTopUp && topUpAmount ? (
            <TopUpModal
              suggestedAmount={topUpAmount}
              currentBalance={balance ?? 0}
              onComplete={handleTopUpComplete}
              onClose={() => { setShowTopUp(false); setTopUpAmount(null) }}
            />
          ) : (
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl max-h-[90vh] overflow-y-auto">
              <h3 className="font-black text-stone-900 text-lg mb-1">Send a gift</h3>
              <p className="text-stone-500 text-sm mb-5">
                100% goes to {creatorName}. Instant from your wallet.
              </p>

              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

              {/* Wallet balance */}
              <div className="bg-stone-50 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                <span className="text-sm text-stone-600">Wallet balance</span>
                <span className="font-bold text-stone-900">
                  {balance !== null ? formatPrice(balance) : '...'}
                </span>
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[3, 5, 10, 20].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(String(v))}
                    className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                      rawAmount === v
                        ? 'bg-jungle-600 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    ${v}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-1">Custom amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 pl-7 pr-3 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-jungle-400"
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

              {/* Send or Top Up */}
              {rawAmount > 0 && !needsTopUp ? (
                <button
                  onClick={handleSendGift}
                  disabled={sending || rawAmount <= 0}
                  className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {sending ? 'Sending...' : `Send ${formatPrice(rawAmount)} to ${creatorName}`}
                </button>
              ) : rawAmount > 0 && needsTopUp ? (
                <div className="space-y-3">
                  <div className="bg-amber-50 rounded-xl px-4 py-3">
                    <p className="text-sm text-amber-800 font-medium">
                      You need {formatPrice(rawAmount - (balance ?? 0))} more
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Add funds to your wallet, then send the gift instantly.
                    </p>
                  </div>
                  <button
                    onClick={handleTopUpNeeded}
                    className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Add funds to wallet
                  </button>
                </div>
              ) : null}

              <button
                onClick={handleClose}
                className="w-full text-stone-400 hover:text-stone-600 text-sm transition-colors mt-3"
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

// ── Top-Up Modal ──────────────────────────────────────────────────────────────

function TopUpModal({
  suggestedAmount,
  currentBalance,
  onComplete,
  onClose,
}: {
  suggestedAmount: number
  currentBalance: number
  onComplete: (newBalance: number) => void
  onClose: () => void
}) {
  const [selectedAmount, setSelectedAmount] = useState(suggestedAmount)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl max-h-[90vh] overflow-y-auto">
      <h3 className="font-black text-stone-900 text-lg mb-1">Add funds</h3>
      <p className="text-stone-500 text-sm mb-5">
        Current balance: {formatPrice(currentBalance)}
      </p>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {!clientSecret ? (
        <>
          {/* Amount presets */}
          <div className="grid grid-cols-3 gap-2 mb-4">
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
          <div className="mb-4">
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
          <div className="bg-stone-50 rounded-xl p-4 text-sm mb-4 space-y-1">
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

          <button
            onClick={handleStartPayment}
            disabled={loading}
            className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : `Add ${formatPrice(selectedAmount)} to wallet`}
          </button>
        </>
      ) : (
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
          <TopUpPaymentForm
            amount={selectedAmount}
            chargeTotal={chargeTotal}
            onComplete={onComplete}
            onError={(msg) => setError(msg)}
          />
        </Elements>
      )}

      <button
        onClick={onClose}
        className="w-full text-stone-400 hover:text-stone-600 text-sm transition-colors mt-3"
      >
        Back
      </button>
    </div>
  )
}

// ── Stripe Payment Form for Top-Up ────────────────────────────────────────────

function TopUpPaymentForm({
  amount,
  chargeTotal,
  onComplete,
  onError,
}: {
  amount: number
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
      // Confirm the top-up server-side to credit the wallet
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
