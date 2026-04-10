'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { formatPrice, calculatePriceBreakdown, PLATFORM_FEE_PCT } from '@junglegym/shared'
import type { PriceTier } from '@junglegym/shared'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const TIERS: { key: PriceTier; label: string; emoji: string; desc: string }[] = [
  { key: 'supported', label: 'Supported', emoji: '🌱', desc: 'Pay what you can' },
  { key: 'community', label: 'Community', emoji: '🌿', desc: 'Chip in a little more' },
  { key: 'abundance', label: 'Abundance', emoji: '🌳', desc: "You're thriving — share it" },
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
  const router = useRouter()

  const prices: Record<PriceTier, number | null> = {
    supported: priceSupported,
    community: priceCommunity,
    abundance: priceAbundance,
  }

  const selectedPrice = prices[selectedTier] ?? 0
  const { creatorAmount, platformFee } = calculatePriceBreakdown(selectedPrice)

  async function handleCheckout() {
    if (!isLoggedIn) {
      router.push(`/auth/login?next=/video/${videoId}`)
      return
    }
    if (!selectedPrice) return
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
      setClientSecret(data.clientSecret)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  if (clientSecret) {
    return (
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
        {TIERS.map(({ key, label, emoji, desc }) => {
          const price = prices[key]
          if (!price) return null
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedTier(key)}
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

      {/* Price breakdown — flat 20% fee */}
      {selectedPrice > 0 && (
        <div className="bg-jungle-50 border border-jungle-100 rounded-xl p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-700">
            <span>To creator (80%)</span>
            <span className="font-semibold">{formatPrice(creatorAmount)}</span>
          </div>
          <div className="flex justify-between text-stone-500 text-xs">
            <span>Platform fee ({PLATFORM_FEE_PCT}%)</span>
            <span>{formatPrice(platformFee)}</span>
          </div>
          <div className="flex justify-between font-black text-stone-900 pt-1 border-t border-jungle-100">
            <span>Total</span>
            <span>{formatPrice(selectedPrice)}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Loading...' : isLoggedIn ? 'Unlock this class' : 'Sign in to unlock'}
      </button>
      <p className="text-xs text-stone-400 text-center">
        The price you see is the price you pay. 80% to the creator, {PLATFORM_FEE_PCT}% platform fee.
      </p>
    </div>
  )
}

function InlineCheckoutForm({
  videoId,
  total,
  onCancel,
  onSuccess,
}: {
  videoId: string
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

    // Record the purchase in the database
    if (paymentIntent?.id) {
      try {
        await fetch('/api/checkout/video/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        })
      } catch {
        // Payment succeeded even if confirm fails — webhook will catch it
      }
    }

    onSuccess()
    setLoading(false)
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-stone-900 text-sm">Payment details</h3>
        <button type="button" onClick={onCancel} className="text-xs text-stone-400 hover:text-stone-600">
          ← Change tier
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
