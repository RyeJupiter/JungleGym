'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { formatPrice, calculateGiftTotal } from '@junglegym/shared'
import type { PriceTier } from '@junglegym/shared'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const TIER_LABELS: Record<PriceTier, { label: string; desc: string }> = {
  supported: { label: 'Supported', desc: 'Pay what you can' },
  community: { label: 'Community', desc: 'Chip in a little more' },
  abundance: { label: 'Abundance', desc: "You're thriving — share it" },
}

const TIP_PRESETS = [0, 10, 20, 50, 100]

export function PurchaseButton({
  videoId,
  priceSupported,
  priceCommunity,
  priceAbundance,
  isLoggedIn,
}: {
  videoId: string
  priceSupported: number | null
  priceCommunity: number | null
  priceAbundance: number | null
  isLoggedIn: boolean
}) {
  const [selectedTier, setSelectedTier] = useState<PriceTier>('community')
  const [tipPct, setTipPct] = useState(10)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const prices: Record<PriceTier, number | null> = {
    supported: priceSupported,
    community: priceCommunity,
    abundance: priceAbundance,
  }

  const selectedPrice = prices[selectedTier] ?? 0
  const { platformAmount, total } = calculateGiftTotal(selectedPrice, tipPct)

  async function handleCheckout() {
    if (!isLoggedIn) {
      router.push(`/auth/login?next=/video/${videoId}`)
      return
    }
    if (!selectedPrice) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, tier: selectedTier, tipPct }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
      setClientSecret(data.clientSecret)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  if (clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm
          clientSecret={clientSecret}
          total={total}
          onCancel={() => setClientSecret(null)}
          onSuccess={() => router.refresh()}
        />
      </Elements>
    )
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
      <h3 className="font-bold text-stone-900 text-sm">Choose your tier</h3>
      {error && <p className="text-red-600 text-xs">{error}</p>}

      {/* Tier picker */}
      <div className="space-y-2">
        {(Object.entries(TIER_LABELS) as [PriceTier, { label: string; desc: string }][]).map(
          ([tier, { label, desc }]) => {
            const price = prices[tier]
            if (!price) return null
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setSelectedTier(tier)}
                className={`w-full text-left rounded-xl p-3 border-2 transition-colors ${
                  selectedTier === tier
                    ? 'border-jungle-500 bg-jungle-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm text-stone-900">{label}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
                  </div>
                  <span className="font-black text-stone-900">{formatPrice(price)}</span>
                </div>
              </button>
            )
          }
        )}
      </div>

      {/* Platform tip */}
      <div className="bg-stone-50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-stone-700">Tip the jungle gym? 🌿</p>
          <p className="text-xs text-stone-400">Totally optional</p>
        </div>
        <div className="flex gap-2">
          {TIP_PRESETS.map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setTipPct(pct)}
              className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${
                tipPct === pct
                  ? 'bg-jungle-600 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:border-jungle-400'
              }`}
            >
              {pct === 0 ? 'None' : `${pct}%`}
            </button>
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={200}
          step={5}
          value={tipPct}
          onChange={(e) => setTipPct(Number(e.target.value))}
          className="w-full accent-jungle-500"
        />
        <p className="text-xs text-stone-400 text-center">{tipPct}% — {tipPct === 0 ? 'no tip' : tipPct >= 100 ? "you're amazing 🙏" : 'thank you!'}</p>
      </div>

      {/* Receipt breakdown */}
      {selectedPrice > 0 && (
        <div className="bg-jungle-50 border border-jungle-100 rounded-xl p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-700">
            <span>To creator</span>
            <span className="font-semibold">{formatPrice(selectedPrice)}</span>
          </div>
          <div className="flex justify-between text-stone-500 text-xs">
            <span>Platform tip ({tipPct}%)</span>
            <span>{tipPct > 0 ? `+ ${formatPrice(platformAmount)}` : 'None'}</span>
          </div>
          <div className="flex justify-between font-black text-stone-900 pt-1 border-t border-jungle-100">
            <span>You pay</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Loading...' : isLoggedIn ? 'Drop into this class' : 'Sign in to drop in'}
      </button>
      <p className="text-xs text-stone-400 text-center">
        100% of the video price goes directly to the creator.
      </p>
    </div>
  )
}

function CheckoutForm({
  clientSecret,
  total,
  onCancel,
  onSuccess,
}: {
  clientSecret: string
  total: number
  onCancel: () => void
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Payment failed')
      setLoading(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed')
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-stone-900 text-sm">Complete payment</h3>
        <button type="button" onClick={onCancel} className="text-xs text-stone-400 hover:text-stone-600">
          ← Back
        </button>
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        <button
          type="submit"
          disabled={loading || !stripe}
          className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : `Pay ${formatPrice(total)}`}
        </button>
      </form>
    </div>
  )
}
