import { NextResponse } from 'next/server'

// DEBUG-ONLY endpoint for the worker-secrets-cleanup migration.
// Reports which expected env vars are present at runtime — reports
// presence and length only, never the values.
//
// Used to verify that @opennextjs/cloudflare wires Cloudflare Worker
// secret bindings into process.env at request time, before we remove
// the .env.local smuggling hack in next.config.js.
//
// DELETE THIS ROUTE once the migration is complete.

const EXPECTED_KEYS = [
  // Smuggled via .env.local hack today — migrating to wrangler secrets
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  // Smoke-test secret, set only via wrangler secret put, never bundled
  'TEST_BINDING',
  // Client-side (inlined at build time, should always be present)
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
] as const

export async function GET() {
  const report = Object.fromEntries(
    EXPECTED_KEYS.map((key) => {
      const val = process.env[key]
      return [
        key,
        val
          ? { present: true, length: val.length, prefix: val.slice(0, 6) }
          : { present: false },
      ]
    })
  )

  return NextResponse.json({
    note: 'Debug endpoint for worker-secrets-cleanup migration — delete after.',
    runtime: 'cloudflare-workers',
    env: report,
  })
}
