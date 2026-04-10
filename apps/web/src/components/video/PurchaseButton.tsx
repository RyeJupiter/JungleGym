'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { formatPrice, calculatePriceBreakdown, PLATFORM_FEE_PCT } from '@junglegym/shared'
import type { PriceTier } from '@junglegym/shared'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const TIERS: { key: PriceTier; label: string; emoji: string; desc: string }[] = [
  { key: 'supported', label: 'Supported', emoji: '🌱', desc: 'Pay what you can' },
  { key: 'community', label: 'Community', emoji: '🌿', desc: 'The sweet spot' },
  { key: 'abundance', label: 'Abundance', emoji: '🌳', desc: 'Pay it forward' },
]

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
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedTierRef = useRef<PriceTier | null>(null)
  const router = useRouter()

  const prices: Record<PriceTier, number | null> = {
    supported: priceSupported,
    community: priceCommunity,
    abundance: priceAbundance,
  }

  const selectedPrice = prices[selectedTier] ?? 0
  const { creatorAmount, platformFee } = calculatePriceBreakdown(selectedPrice)

  // Auto-create PaymentIntent when tier changes (for logged-in users)
  useEffect(() => {
    if (!isLoggedIn || !selectedPrice || fetchedTierRef.current === selectedTier) return

    let cancelled = false
    async function createIntent() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/checkout/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId, tier: selectedTier }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
        if (!cancelled) {
          setClientSecret(data.clientSecret)
          fetchedTierRef.current = selectedTier
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Checkout failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    createIntent()
    return () => { cancelled = true }
  }, [isLoggedIn, selectedPrice, selectedTier, videoId])

  function handleTierChange(tier: PriceTier) {
    if (tier === selectedTier) return
    setSelectedTier(tier)
    setClientSecret(null)
    fetchedTierRef.current = null
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
      {error && <p className="text-red-600 text-xs">{error}</p>}

      {/* Tier picker */}
      <div className="space-y-2">
        {TIERS.map(({ key, label, emoji, desc }) => {
          const price = prices[key]
          if (!price) return null
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleTierChange(key)}
              className={`w-full text-left rounded-xl p-3 border-2 transition-colors ${
                selectedTier === key
                  ? 'border-jungle-500 bg-jungle-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span>{emoji}</span>
                  <div>
                    <p className="font-bold text-sm text-stone-900">{label}</p>
                    <p className="text-xs text-stone-500">{desc}</p>
                  </div>
                </div>
                <span className="font-black text-stone-900">{formatPrice(price)}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Breakdown as inline text */}
      <p className="text-xs text-stone-400 text-center">
        {formatPrice(selectedPrice)} total — {formatPrice(creatorAmount)} to creator, {formatPrice(platformFee)} platform fee ({PLATFORM_FEE_PCT}%).
      </p>

      {/* Payment form inline — ready for one-click if card is saved */}
      {clientSecret ? (
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
          <InlineCheckoutForm
            videoId={videoId}
            total={selectedPrice}
            onSuccess={() => router.refresh()}
          />
        </Elements>
      ) : loading ? (
        <div className="flex items-center justify-center py-4">
          <svg className="animate-spin w-5 h-5 text-jungle-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : !isLoggedIn ? (
        <button
          onClick={() => router.push(`/auth/login?next=/video/${videoId}`)}
          className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Sign in to unlock
        </button>
      ) : null}
    </div>
  )
}

function InlineCheckoutForm({
  videoId,
  total,
  onSuccess,
}: {
  videoId: string
  total: number
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

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed')
      setLoading(false)
      return
    }

    // Record the purchase
    if (paymentIntent?.id) {
      try {
        await fetch('/api/checkout/video/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        })
      } catch {
        // Payment succeeded — webhook will catch it if confirm fails
      }
    }

    onSuccess()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <PaymentElement />
      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Unlock for ${formatPrice(total)}`}
      </button>
    </form>
  )
}
