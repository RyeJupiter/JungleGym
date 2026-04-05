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
  // Cloudflare Pages dashboard env vars are only available at build time,
  // not at runtime in the Workers environment. Inline server-only secrets
  // into the server bundle so they survive into production.
  webpack: (config, { isServer, webpack }) => {
    if (isServer && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(process.env.SUPABASE_SERVICE_ROLE_KEY),
        })
      )
    }
    return config
  },
}

module.exports = nextConfig
