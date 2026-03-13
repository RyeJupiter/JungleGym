'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@junglegym/shared'

export function createBrowserSupabaseClient() {
  return createClientComponentClient<Database>()
}
