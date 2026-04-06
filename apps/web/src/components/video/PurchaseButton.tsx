'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice, calculateGiftTotal } from '@junglegym/shared'
import type { PriceTier } from '@junglegym/shared'

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
        body: JSON.stringify({ videoId, tier: selectedTier, tipPct }),
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

      {/* Platform donation */}
      <div className="bg-stone-50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-stone-700">Donate to the jungle gym? 🌿</p>
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
        <p className="text-xs text-stone-400 text-center">{tipPct}% — {tipPct === 0 ? 'no donation' : tipPct >= 100 ? 'you\'re amazing 🙏' : 'thank you!'}</p>
      </div>

      {/* Receipt breakdown */}
      {selectedPrice > 0 && (
        <div className="bg-jungle-50 border border-jungle-100 rounded-xl p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-700">
            <span>To creator</span>
            <span className="font-semibold">{formatPrice(selectedPrice)}</span>
          </div>
          <div className="flex justify-between text-stone-500 text-xs">
            <span>Platform donation ({tipPct}%)</span>
            <span>{tipPct > 0 ? `+ ${formatPrice(platformAmount)}` : 'None'}</span>
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
        100% of the video price goes directly to the creator.
      </p>
    </div>
  )
}
