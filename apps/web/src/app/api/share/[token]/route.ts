import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const origin = new URL(request.url).origin

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Send logged-out visitors to the friendly landing page instead of straight
    // to login — gives context and an inline signup path.
    return NextResponse.redirect(`${origin}/share/${token}`)
  }

  const result = await supabase.rpc('redeem_video_share', {
    p_token: token,
    p_user_id: user.id,
  })

  const data = result.data as { error?: string; video_id?: string; owner_user_id?: string } | null

  if (result.error || !data) {
    return NextResponse.redirect(`${origin}/explore?notice=share_error`)
  }
  if (data.error === 'invalid_token') {
    return NextResponse.redirect(`${origin}/explore?notice=invalid_share`)
  }
  if (data.error === 'already_redeemed') {
    return NextResponse.redirect(`${origin}/explore?notice=share_used`)
  }
  if (data.error === 'cannot_redeem_own') {
    // Owner clicked their own share link — just send them to the video
    return NextResponse.redirect(`${origin}/explore?notice=own_share`)
  }

  return NextResponse.redirect(`${origin}/video/${data.video_id}?shared=1`)
}
