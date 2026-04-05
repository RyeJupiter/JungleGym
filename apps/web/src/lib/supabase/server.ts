import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { cookies } from 'next/headers'
import type { Database } from '@junglegym/shared'

export async function createServiceSupabaseClient() {
  // Non-NEXT_PUBLIC_ env vars aren't in process.env on Cloudflare Workers.
  // They're available via the Cloudflare context bindings instead.
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const debugParts: string[] = []
  if (serviceRoleKey) {
    debugParts.push('found in process.env')
  } else {
    debugParts.push('not in process.env')
    // Try sync first (production — worker sets global context)
    try {
      const ctx = getCloudflareContext()
      const envKeys = Object.keys(ctx.env as Record<string, unknown>)
      debugParts.push(`sync ctx.env keys: [${envKeys.join(', ')}]`)
      serviceRoleKey = (ctx.env as Record<string, string>).SUPABASE_SERVICE_ROLE_KEY
    } catch (e) {
      debugParts.push(`sync failed: ${e instanceof Error ? e.message : String(e)}`)
      // Try async fallback (dev mode)
      try {
        const ctx = await getCloudflareContext({ async: true })
        const envKeys = Object.keys(ctx.env as Record<string, unknown>)
        debugParts.push(`async ctx.env keys: [${envKeys.join(', ')}]`)
        serviceRoleKey = (ctx.env as Record<string, string>).SUPABASE_SERVICE_ROLE_KEY
      } catch (e2) {
        debugParts.push(`async failed: ${e2 instanceof Error ? e2.message : String(e2)}`)
      }
    }
  }
  if (!serviceRoleKey) {
    throw new Error(`SUPABASE_SERVICE_ROLE_KEY is not set | debug: ${debugParts.join(' → ')}`)
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
