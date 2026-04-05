import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@junglegym/shared'
import { SERVICE_ROLE_KEY } from './_service-key.generated'

export function createServiceSupabaseClient() {
  if (!SERVICE_ROLE_KEY) throw new Error(`SERVICE_ROLE_KEY is empty | type=${typeof SERVICE_ROLE_KEY} | len=${SERVICE_ROLE_KEY?.length ?? 'null'} | processEnv=${typeof process.env.SUPABASE_SERVICE_ROLE_KEY}`)
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, SERVICE_ROLE_KEY)
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
