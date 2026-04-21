/** @type {import('next').NextConfig} */

// Content Security Policy.
// Kept permissive for scripts because Next 15 uses inline bootstrap scripts
// and eval for dev/HMR; tightening script-src would require per-request
// nonces and a custom server. Everything else is locked down — connect-src,
// frame-src, media-src, form-action, and frame-ancestors are the meaningful
// defense-in-depth wins here.
const SUPABASE_HOST = 'https://*.supabase.co'
const SUPABASE_WS = 'wss://*.supabase.co'
const CSP = [
  "default-src 'self'",
  // Inline + eval needed by Next.js runtime. unsafe-inline is the
  // practical default on Next 15 without custom nonces.
  // cloudflareinsights = Web Analytics beacon injected by CF.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // *.cloudflarestream.com also matches customer-XXX.cloudflarestream.com;
  // a CSP source like customer-*.cloudflarestream.com is invalid per spec
  // (wildcards must be leftmost) and browsers drop it.
  `connect-src 'self' ${SUPABASE_HOST} ${SUPABASE_WS} https://api.stripe.com https://*.cloudflarestream.com https://cloudflareinsights.com`,
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.cloudflarestream.com https://challenges.cloudflare.com",
  `media-src 'self' blob: ${SUPABASE_HOST} https://*.cloudflarestream.com`,
  "worker-src 'self' blob:",
  "base-uri 'self'",
  // Stripe Checkout redirects user into Stripe-hosted forms
  "form-action 'self' https://checkout.stripe.com https://connect.stripe.com",
  // Block embedding the app in iframes (clickjacking defense)
  "frame-ancestors 'none'",
].join('; ')

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@junglegym/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'junglegym.academy',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
