'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@junglegym/shared'

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
