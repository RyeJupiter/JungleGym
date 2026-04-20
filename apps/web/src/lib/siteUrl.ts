/**
 * Canonical site origin. Prefer NEXT_PUBLIC_SITE_URL (baked in at build),
 * fall back to the production URL. Never read from Host/Origin headers —
 * those are attacker-controlled and can poison redirect URLs.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://junglegym.academy').replace(/\/$/, '')
