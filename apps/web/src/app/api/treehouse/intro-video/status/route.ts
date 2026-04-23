import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getVideoStatus } from '@/lib/cloudflare-stream'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const uid = searchParams.get('uid')
  if (!uid) {
    return NextResponse.json({ error: 'uid is required' }, { status: 400 })
  }

  const status = await getVideoStatus(uid)
  if (!status) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }
  return NextResponse.json(status)
}
