import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(req: Request) {
  // 1. Verify the caller is authenticated (getUser validates JWT server-side)
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. CSRF / confirmation defense-in-depth: caller must supply their username
  //    and it must match what's actually on their profile. An attacker-controlled
  //    page cannot forge this even if the session cookie is somehow sent.
  const body = await req.json().catch(() => null)
  const suppliedUsername = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''

  if (!suppliedUsername) {
    return NextResponse.json({ error: 'Username confirmation required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!profile || (profile as any).username !== suppliedUsername) {
    return NextResponse.json({ error: 'Username does not match' }, { status: 403 })
  }

  // 3. All checks passed — delete the account (requires service role key)
  let admin
  try {
    admin = await createServiceSupabaseClient()
  } catch {
    return NextResponse.json({ error: 'Account deletion is temporarily unavailable' }, { status: 503 })
  }
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
