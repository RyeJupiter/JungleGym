'use client'

import { useState, useEffect, useRef } from 'react'
import { formatPrice, calculatePriceBreakdown, PLATFORM_FEE_PCT } from '@junglegym/shared'
import type { PriceTier } from '@junglegym/shared'
import { PaymentForm } from './PaymentForm'

const TIERS: { key: PriceTier; label: string; emoji: string; desc: string }[] = [
  { key: 'supported', label: 'Supported', emoji: '🌱', desc: 'Pay what you can' },
  { key: 'community', label: 'Community', emoji: '🌿', desc: 'Chip in a little more' },
  { key: 'abundance', label: 'Abundance', emoji: '🌳', desc: "You're thriving — share it" },
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
  const fetchedTierRef = useRef<PriceTier | null>(null)

  const prices: Record<PriceTier, number | null> = {
    supported: priceSupported,
    community: priceCommunity,
    abundance: priceAbundance,
  }

  const selectedPrice = prices[selectedTier] ?? 0
  const { creatorAmount, platformFee } = calculatePriceBreakdown(selectedPrice)

  // Auto-create PaymentIntent when tier is selected and we don't have one for it
  useEffect(() => {
    if (!selectedPrice || fetchedTierRef.current === selectedTier) return

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
        if (!res.ok) throw new Error(data.error ?? 'Failed to start checkout')
        if (!cancelled) {
          setClientSecret(data.clientSecret)
          fetchedTierRef.current = selectedTier
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to start checkout')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    createIntent()
    return () => { cancelled = true }
  }, [selectedTier, selectedPrice, videoId])

  function handleTierChange(tier: PriceTier) {
    if (tier === selectedTier) return
    setSelectedTier(tier)
    // Reset secret so a new PaymentIntent is created for the new amount
    setClientSecret(null)
    fetchedTierRef.current = null
  }

  return (
    <div className="space-y-6">
      {/* Tier selector — always visible */}
      <div>
        <h2 className="text-lg font-bold text-jungle-300 mb-3">Choose your tier</h2>
        <div className="space-y-2">
          {TIERS.map(({ key, label, emoji, desc }) => {
            const price = prices[key]
            if (!price) return null
            const isSelected = selectedTier === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleTierChange(key)}
                className={`w-full text-left rounded-xl px-4 py-3 border-2 transition-all ${
                  isSelected
                    ? 'border-jungle-400 bg-jungle-800/60'
                    : 'border-jungle-800 bg-jungle-800/20 hover:border-jungle-700 hover:bg-jungle-800/40'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{emoji}</span>
                    <div>
                      <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-jungle-200'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-jungle-500">{desc}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-black ${isSelected ? 'text-jungle-400' : 'text-jungle-300'}`}>
                    {formatPrice(price)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Price breakdown */}
      {selectedPrice > 0 && (
        <div className="bg-jungle-800/40 border border-jungle-800 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between font-black text-white pb-2 border-b border-jungle-800">
            <span>Total</span>
            <span>{formatPrice(selectedPrice)}</span>
          </div>
          <div className="flex justify-between text-jungle-300">
            <span>To creator (80%)</span>
            <span className="font-semibold">{formatPrice(creatorAmount)}</span>
          </div>
          <div className="flex justify-between text-jungle-600 text-xs">
            <span>Platform fee ({PLATFORM_FEE_PCT}%)</span>
            <span>{formatPrice(platformFee)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Payment form — appears once PaymentIntent is created */}
      {clientSecret ? (
        <div>
          <h2 className="text-lg font-bold text-jungle-300 mb-3">Payment details</h2>
          <PaymentForm clientSecret={clientSecret} videoId={videoId} theme="dark" />
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin w-6 h-6 text-jungle-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : null}

      <p className="text-xs text-jungle-600 text-center">
        80% goes to the creator. {PLATFORM_FEE_PCT}% platform fee keeps JungleGym running.
      </p>
    </div>
  )
}
