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
  // Cloudflare Pages dashboard env vars are only available at build time.
  // Next.js's env config inlines these into the bundle via its own DefinePlugin,
  // which works across all compilation passes (including RSC).
  // Only server-side code imports createServiceSupabaseClient, so this value
  // won't appear in client bundles due to tree-shaking.
  env: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
}

module.exports = nextConfig
