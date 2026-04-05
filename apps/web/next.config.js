const fs = require('fs')

// Cloudflare Pages dashboard env vars exist at build time but NOT at runtime
// (the Workers env only has ASSETS). The @opennextjs/cloudflare adapter bakes
// .env* files into the worker bundle via next-env.mjs and loads them at runtime.
// So we write server-only secrets to .env.production.local during the build,
// which OpenNext picks up and embeds in the final worker.
if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.CF_PAGES) {
  const envContent = `SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY}\n`
  fs.writeFileSync('.env.production.local', envContent)
  console.log('[next.config] Wrote SUPABASE_SERVICE_ROLE_KEY to .env.production.local for OpenNext')
}

/** @type {import('next').NextConfig} */
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
}

module.exports = nextConfig
