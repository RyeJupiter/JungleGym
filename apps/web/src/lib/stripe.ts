import Stripe from 'stripe'

// Initialized lazily so `next build` doesn't fail when the env var is absent.
// On Cloudflare Workers we MUST use the fetch-based HTTP client — Stripe's
// default Node http/https transport isn't reliably supported by the Workers
// nodejs_compat shim and fails with "connection to Stripe" errors.
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-03-31.basil',
    httpClient: Stripe.createFetchHttpClient(),
  })
}
