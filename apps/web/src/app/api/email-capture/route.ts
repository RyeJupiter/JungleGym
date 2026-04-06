import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const source = typeof body?.source === 'string' ? body.source : 'homepage'

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('email_captures')
    .insert({ email, source })

  // Ignore duplicate — already signed up is still a success from UX perspective
  if (error && !error.message.includes('unique')) {
    return NextResponse.json({ error: 'Failed to save email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
