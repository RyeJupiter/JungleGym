import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Only allow same-origin paths. Rejects `//evil.com`, `http://evil.com`,
// and anything that doesn't start with a single `/` followed by a non-slash.
function safeRedirectPath(next: string | null): string {
  if (!next) return '/explore'
  if (!next.startsWith('/')) return '/explore'
  if (next.startsWith('//')) return '/explore'
  if (next.startsWith('/\\')) return '/explore'
  return next
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRedirectPath(searchParams.get('next'))

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Ensure user + profile rows exist (handles Google OAuth new users)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existing) {
          const displayName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'User'
          const baseUsername = (user.email?.split('@')[0] ?? 'user').toLowerCase().replace(/[^a-z0-9_-]/g, '')
          const username = `${baseUsername}${Math.floor(Math.random() * 1000)}`

          await supabase.from('users').insert({
            id: user.id,
            email: user.email!,
            role: 'learner',
          })
          await supabase.from('profiles').insert({
            user_id: user.id,
            display_name: displayName,
            username,
            tags: [],
          })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
