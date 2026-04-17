import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@junglegym/shared'

// Workaround for CF Workers error 1016 when fetching CF-proxied origins (Supabase).
// A CNAME `sb-api.junglegym.academy` → `agiofjruimagfkhzeira.supabase.co` forces
// proper DNS resolution instead of CF's broken internal routing.
// See: https://community.cloudflare.com/t/912151
const cfFetch: typeof globalThis.fetch = (input, init) => {
  return fetch(input, {
    ...init,
    // @ts-expect-error CF Workers-specific fetch option
    cf: { resolveOverride: 'sb-api.junglegym.academy' },
  })
}

export function createServiceSupabaseClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    global: { fetch: cfFetch },
  })
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: cfFetch },
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
