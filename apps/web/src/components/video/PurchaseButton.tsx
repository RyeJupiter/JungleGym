'use client'

import { useRouter } from 'next/navigation'
import { formatPrice } from '@junglegym/shared'

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
  const router = useRouter()

  // Show the lowest available price as the starting price
  const lowestPrice = priceSupported ?? priceCommunity ?? priceAbundance

  function handleUnlock() {
    if (!isLoggedIn) {
      router.push(`/auth/login?next=/video/${videoId}/checkout`)
      return
    }
    router.push(`/video/${videoId}/checkout`)
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
      <h3 className="font-bold text-stone-900 text-sm">Unlock this video</h3>

      {lowestPrice && (
        <p className="text-stone-500 text-sm">
          Starting at <span className="font-bold text-stone-900">{formatPrice(lowestPrice)}</span>
        </p>
      )}

      <button
        onClick={handleUnlock}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors"
      >
        {isLoggedIn ? 'Unlock this video' : 'Sign in to unlock'}
      </button>

      <p className="text-xs text-stone-400 text-center">
        80% goes directly to the creator.
      </p>
    </div>
  )
}
