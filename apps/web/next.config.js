const fs = require('fs')

// In CI (GitHub Actions → wrangler deploy), server-side secrets exist in
// process.env at build time but there's no .env.local file. OpenNext bakes
// .env* files into next-env.mjs which gets loaded at runtime via
// populateProcessEnv() — so we write a .env.local during the build to smuggle
// server-side secrets into the Worker bundle. Next.js does NOT inline
// non-NEXT_PUBLIC_* env vars into the server bundle, so without this step
// process.env.FOO is undefined at request time on Cloudflare Workers.
//
// To add a new server-side secret:
//   1. Add it to GitHub Actions secrets (repo Settings → Secrets → Actions)
//   2. Reference it in the `Build for Cloudflare` env block in deploy.yml
//   3. Add its name to SERVER_SECRETS below
const SERVER_SECRETS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
]

if (!fs.existsSync('.env.local')) {
  const lines = SERVER_SECRETS
    .filter((name) => process.env[name])
    .map((name) => `${name}=${process.env[name]}`)
  if (lines.length > 0) {
    fs.writeFileSync('.env.local', lines.join('\n') + '\n')
    console.log(
      '[next.config] Wrote .env.local with server secrets for OpenNext:',
      SERVER_SECRETS.filter((name) => process.env[name]).join(', ')
    )
  }
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
