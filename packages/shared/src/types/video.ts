export type PriceTier = 'supported' | 'community' | 'abundance'

export interface Video {
  id: string
  creatorId: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  videoUrl: string | null
  durationSeconds: number | null
  isFree: boolean
  // Pre-calculated fun prices (null for free videos)
  priceSupported: number | null
  priceCommunity: number | null
  priceAbundance: number | null
  tags: string[]
  published: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

export interface Purchase {
  id: string
  userId: string
  videoId: string
  tier: PriceTier
  amountPaid: number        // video price — 100% goes to creator
  platformTipPct: number    // buyer-adjustable, default 10, can be 0
  platformAmount: number    // amountPaid * (platformTipPct / 100)
  totalAmount: number       // amountPaid + platformAmount
  createdAt: string
}
