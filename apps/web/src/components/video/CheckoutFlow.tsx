'use client'

import { useState } from 'react'
import { formatPrice, calculateGiftTotal, PLATFORM_FEE_PCT } from '@junglegym/shared'
import type { PriceTier } from '@junglegym/shared'
import { PaymentForm } from './PaymentForm'

const TIERS: { key: PriceTier; label: string; desc: string }[] = [
  { key: 'supported', label: 'Supported', desc: 'Pay what you can' },
  { key: 'community', label: 'Community', desc: 'Chip in a little more' },
  { key: 'abundance', label: 'Abundance', desc: "You're thriving — share it" },
]

export function CheckoutFlow({
  videoId,
  priceSupported,
  priceCommunity,
  priceAbundance,
}: {
  videoId: string
  priceSupported: number | null
  priceCommunity: number | null
  priceAbundance: number | null
}) {
  const [selectedTier, setSelectedTier] = useState<PriceTier>('community')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const prices: Record<PriceTier, number | null> = {
    supported: priceSupported,
    community: priceCommunity,
    abundance: priceAbundance,
  }

  const selectedPrice = prices[selectedTier] ?? 0
  const { platformAmount, total } = calculateGiftTotal(selectedPrice)

  async function handleContinue() {
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
      if (!res.ok) throw new Error(data.error ?? 'Failed to start checkout')
      setClientSecret(data.clientSecret)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    setClientSecret(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white">
        {clientSecret ? 'Payment details' : 'Choose your tier'}
      </h2>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Tier selection */}
      {!clientSecret && (
        <div className="space-y-3">
          {TIERS.map(({ key, label, desc }) => {
            const price = prices[key]
            if (!price) return null
            const isSelected = selectedTier === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedTier(key)}
                className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
                  isSelected
                    ? 'border-jungle-400 bg-jungle-800/60'
                    : 'border-jungle-800 bg-jungle-800/20 hover:border-jungle-700 hover:bg-jungle-800/40'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-bold ${isSelected ? 'text-white' : 'text-jungle-200'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-jungle-500 mt-0.5">{desc}</p>
                  </div>
                  <span className={`text-lg font-black ${isSelected ? 'text-jungle-400' : 'text-jungle-300'}`}>
                    {formatPrice(price)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Price breakdown */}
      {selectedPrice > 0 && (
        <div className="bg-jungle-800/40 border border-jungle-800 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-jungle-300">
            <span>To creator (80%)</span>
            <span className="font-semibold">{formatPrice(selectedPrice)}</span>
          </div>
          <div className="flex justify-between text-jungle-600 text-xs">
            <span>JungleGym platform ({PLATFORM_FEE_PCT}%)</span>
            <span>+ {formatPrice(platformAmount)}</span>
          </div>
          <div className="flex justify-between font-black text-white pt-2 border-t border-jungle-800">
            <span>You pay</span>
            <span>{formatPrice(total)}</span>
          </div>
          {clientSecret && (
            <button
              type="button"
              onClick={handleBack}
              className="text-xs text-jungle-500 hover:text-jungle-400 transition-colors mt-1"
            >
              &larr; Change tier
            </button>
          )}
        </div>
      )}

      {/* Payment or continue button */}
      {clientSecret ? (
        <PaymentForm clientSecret={clientSecret} videoId={videoId} theme="dark" />
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleContinue}
            disabled={loading || !selectedPrice}
            className="w-full bg-jungle-500 hover:bg-jungle-400 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 text-lg"
          >
            {loading ? 'Setting up payment...' : 'Continue to payment'}
          </button>
          <p className="text-xs text-jungle-600 text-center">
            80% of the video price goes directly to the creator. {PLATFORM_FEE_PCT}% keeps JungleGym running.
          </p>
        </div>
      )}
    </div>
  )
}
