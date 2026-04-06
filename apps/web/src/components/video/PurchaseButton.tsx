'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice, calculateGiftTotal, PLATFORM_FEE_PCT } from '@junglegym/shared'
import type { PriceTier } from '@junglegym/shared'

const TIER_LABELS: Record<PriceTier, { label: string; desc: string }> = {
  supported: { label: 'Supported', desc: 'Pay what you can' },
  community: { label: 'Community', desc: 'Chip in a little more' },
  abundance: { label: 'Abundance', desc: "You're thriving — share it" },
}

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const prices: Record<PriceTier, number | null> = {
    supported: priceSupported,
    community: priceCommunity,
    abundance: priceAbundance,
  }

  const selectedPrice = prices[selectedTier] ?? 0
  const { platformAmount, total } = calculateGiftTotal(selectedPrice)

  async function handlePurchase() {
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
      window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
      <h3 className="font-bold text-stone-900 text-sm">Choose your tier</h3>
      {error && <p className="text-red-600 text-xs">{error}</p>}

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

      {selectedPrice > 0 && (
        <div className="bg-jungle-50 border border-jungle-100 rounded-xl p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-700">
            <span>To creator (80%)</span>
            <span className="font-semibold">{formatPrice(selectedPrice)}</span>
          </div>
          <div className="flex justify-between text-stone-500 text-xs">
            <span>JungleGym platform (20%)</span>
            <span>+ {formatPrice(platformAmount)}</span>
          </div>
          <div className="flex justify-between font-black text-stone-900 pt-1 border-t border-jungle-100">
            <span>You pay</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      )}

      <button
        onClick={handlePurchase}
        disabled={loading}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Redirecting to checkout…' : isLoggedIn ? 'Unlock this video' : 'Sign in to unlock'}
      </button>
      <p className="text-xs text-stone-400 text-center">
        80% of the video price goes directly to the creator. {PLATFORM_FEE_PCT}% keeps JungleGym running.
      </p>
    </div>
  )
}
