import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { cookies } from 'next/headers'
import type { Database } from '@junglegym/shared'

export async function createServiceSupabaseClient() {
  // Non-NEXT_PUBLIC_ env vars aren't in process.env on Cloudflare Workers.
  // They're available via the Cloudflare context bindings instead.
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    try {
      const ctx = await getCloudflareContext({ async: true })
      serviceRoleKey = (ctx.env as Record<string, string>).SUPABASE_SERVICE_ROLE_KEY
    } catch {
      // Local dev without wrangler — fall through
    }
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
  )
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
