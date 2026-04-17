import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/debug/supabase
 * Temporary diagnostic endpoint — checks env vars + Supabase connectivity from the Worker.
 * DELETE THIS after debugging.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Check env vars (show first/last 4 chars only)
  const mask = (s: string | undefined) =>
    s ? `${s.slice(0, 4)}...${s.slice(-4)} (len=${s.length})` : 'MISSING'

  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: url ?? 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: mask(anonKey),
    SUPABASE_SERVICE_ROLE_KEY: mask(serviceKey),
  }

  // Try anon client query
  let anonResult: unknown = null
  let anonError: unknown = null
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('videos')
      .select('id, title')
      .eq('published', true)
      .limit(2)
    anonResult = data
    anonError = error
  } catch (e) {
    anonError = e instanceof Error ? e.message : String(e)
  }

  // Try service client query
  let serviceResult: unknown = null
  let serviceError: unknown = null
  try {
    const svc = createServiceSupabaseClient()
    const { data, error } = await svc
      .from('videos')
      .select('id, title')
      .eq('published', true)
      .limit(2)
    serviceResult = data
    serviceError = error
  } catch (e) {
    serviceError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json({
    envCheck,
    anonClient: { data: anonResult, error: anonError },
    serviceClient: { data: serviceResult, error: serviceError },
    timestamp: new Date().toISOString(),
  })
}
