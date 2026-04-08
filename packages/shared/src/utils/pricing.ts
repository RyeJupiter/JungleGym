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
  1.00, 1.11, 2.00, 2.22, 3.00, 3.33, 4.00, 4.20, 4.44, 5.00, 5.55,
  6.00, 6.66, 7.00, 7.77, 8.00, 8.88, 9.00, 9.99, 10.00,
  11.00, 11.11, 12.00, 12.34, 13.00, 13.33, 14.00, 14.44, 15.00, 15.55,
  16.00, 16.66, 17.00, 17.77, 18.00, 18.88, 19.00, 19.99, 20.00,
  21.00, 22.00, 22.22, 23.00, 23.45, 24.00, 24.44, 25.00, 25.55,
  26.00, 26.66, 27.00, 27.77, 28.00, 28.88, 29.00, 29.99, 30.00,
  31.00, 31.11, 33.00, 33.33, 34.56, 35.00, 36.66, 37.77, 38.88, 39.99, 40.00,
  42.00, 44.00, 44.44, 45.00, 45.67, 47.77, 48.88, 49.99, 50.00,
  55.00, 55.55, 56.78, 57.89, 59.99, 60.00,
  66.66, 67.89, 69.00, 69.99, 70.00,
  75.00, 77.77, 78.90, 79.99, 80.00,
  88.88, 89.99, 90.00,
  99.99, 100.00, 111.11, 123.45, 133.33, 144.44,
  155.55, 166.66, 177.77, 188.88, 199.99, 200.00,
  222.22, 234.56, 333.33, 444.44, 555.55,
]

export function roundToFunPrice(rawDollars: number): number {
  if (rawDollars <= 0) return 0

  // Find the nearest fun price <= rawDollars (round down — buyer never pays more than the rate suggests)
  const below = FUN_PRICES.filter((p) => p <= rawDollars).sort((a, b) => b - a)
  if (below.length > 0) return below[0]

  // Fallback: price is below the minimum fun price, return the lowest
  return FUN_PRICES[0]
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

export const PLATFORM_FEE_PCT = 20

export function calculatePriceBreakdown(total: number): {
  creatorAmount: number
  platformFee: number
  total: number
} {
  const platformFee = Math.round(total * (PLATFORM_FEE_PCT / 100) * 100) / 100
  const creatorAmount = Math.round((total - platformFee) * 100) / 100
  return { creatorAmount, platformFee, total }
}
