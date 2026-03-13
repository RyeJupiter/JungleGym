import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@junglegym/shared'

export function createServerSupabaseClient() {
  return createServerComponentClient<Database>({ cookies })
}
