/**
 * Fun price rounding for JungleGym.
 *
 * Given a raw price (duration × rate), we find the nearest "fun" number
 * at or above it — numbers with repeating digits, cultural resonance,
 * or satisfying sequences.
 *
 * Examples: $3.33, $4.20, $6.66, $9.99, $11.11, $12.34, $16.66, $21.00, $31.11
 */

const FUN_PRICES: number[] = [
  1.11, 2.22, 3.33, 4.20, 4.44, 5.55, 6.66, 7.77, 8.88, 9.99,
  11.11, 12.34, 13.33, 14.44, 15.55, 16.66, 17.77, 18.88, 19.99,
  21.00, 22.22, 23.45, 24.44, 25.55, 26.66, 27.77, 28.88, 29.99,
  31.11, 33.33, 34.56, 36.66, 37.77, 38.88, 39.99,
  42.00, 44.44, 45.67, 47.77, 48.88, 49.99,
  55.55, 56.78, 57.89, 59.99,
  66.66, 67.89, 69.00, 69.99,
  77.77, 78.90, 79.99,
  88.88, 89.99,
  99.99, 100.00, 111.11, 123.45, 133.33, 144.44,
  155.55, 166.66, 177.77, 188.88, 199.99, 200.00,
  222.22, 234.56, 333.33, 444.44, 555.55,
]

export function roundToFunPrice(rawDollars: number): number {
  if (rawDollars <= 0) return 0

  // Find the nearest fun price >= rawDollars
  const above = FUN_PRICES.filter((p) => p >= rawDollars).sort((a, b) => a - b)
  if (above.length > 0) return above[0]

  // Fallback for very high prices: find closest overall
  return FUN_PRICES.reduce((prev, cur) =>
    Math.abs(cur - rawDollars) < Math.abs(prev - rawDollars) ? cur : prev
  )
}

export type TierRates = {
  supported: number  // per-minute floor rate
  community: number
  abundance: number
}

export const DEFAULT_TIER_RATES: TierRates = {
  supported: 1,
  community: 2,
  abundance: 3,
}

export function calculateTierPrices(
  durationSeconds: number,
  rates: TierRates = DEFAULT_TIER_RATES
): { supported: number; community: number; abundance: number } {
  const minutes = durationSeconds / 60
  return {
    supported: roundToFunPrice(minutes * rates.supported),
    community: roundToFunPrice(minutes * rates.community),
    abundance: roundToFunPrice(minutes * rates.abundance),
  }
}

export function formatPrice(dollars: number): string {
  return `$${dollars.toFixed(2)}`
}

export function calculateGiftTotal(creatorAmount: number, tipPct: number): {
  platformAmount: number
  total: number
} {
  const platformAmount = Math.round(creatorAmount * (tipPct / 100) * 100) / 100
  return {
    platformAmount,
    total: Math.round((creatorAmount + platformAmount) * 100) / 100,
  }
}
