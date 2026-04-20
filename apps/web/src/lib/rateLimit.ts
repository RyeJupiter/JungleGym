/**
 * Lightweight in-memory rate limiter for public endpoints.
 *
 * CAVEATS — read before using on anything critical:
 * - Cloudflare Workers run as many isolates; state is per-isolate, so a
 *   determined attacker can distribute requests across edges and evade
 *   this limit. Treat this as *baseline* friction, not a real defense.
 * - For anything important (auth endpoints, payment endpoints, account
 *   creation) layer a Cloudflare WAF rate-limit rule on top. This helper
 *   exists to stop the casual script-kiddie level of abuse only.
 */

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(
  key: string,
  maxHits: number,
  windowMs: number
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now()
  const b = buckets.get(key)

  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    // Opportunistic cleanup so the Map doesn't grow unbounded
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k)
    }
    return { ok: true, retryAfterMs: 0 }
  }

  if (b.count >= maxHits) {
    return { ok: false, retryAfterMs: b.resetAt - now }
  }

  b.count += 1
  return { ok: true, retryAfterMs: 0 }
}

/** Best-effort client IP from CF/edge-proxy headers. Falls back to "unknown". */
export function clientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}
