import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export function createSupabaseClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>
