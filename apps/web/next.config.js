const fs = require('fs')

// On Cloudflare Pages, dashboard env vars exist in process.env at build time
// but there's no .env.local file. OpenNext bakes .env* files into next-env.mjs
// which gets loaded at runtime via populateProcessEnv(). Write a .env.local
// so OpenNext picks up the service role key.
if (process.env.SUPABASE_SERVICE_ROLE_KEY && !fs.existsSync('.env.local')) {
  fs.writeFileSync('.env.local', `SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY}\n`)
  console.log('[next.config] Created .env.local with SUPABASE_SERVICE_ROLE_KEY for OpenNext')
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
