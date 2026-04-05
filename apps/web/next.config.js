const fs = require('fs')
const path = require('path')

// Cloudflare Pages env vars exist at build time but NOT at runtime.
// Generate a TS file with the key so webpack bundles it directly.
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const generatedPath = path.join(__dirname, 'src', 'lib', 'supabase', '_service-key.generated.ts')
fs.writeFileSync(generatedPath, `// Auto-generated at build time — do not edit or commit\nexport const SERVICE_ROLE_KEY = ${JSON.stringify(serviceKey)};\n`)
console.log(`[next.config] Generated _service-key.generated.ts (key ${serviceKey ? 'SET' : 'EMPTY'})`)

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
