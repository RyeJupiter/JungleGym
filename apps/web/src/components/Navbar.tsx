import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/admin'
import { NavLinks } from './NavLinks'

export async function Navbar() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let isCreator = false
  let isAdmin = false
  let photoUrl: string | null = null
  let username: string | null = null

  if (authUser) {
    const [{ data: user }, { data: profile }] = await Promise.all([
      supabase.from('users').select('role').eq('id', authUser.id).single(),
      supabase.from('profiles').select('photo_url, username').eq('user_id', authUser.id).single(),
    ])
    isCreator = user?.role === 'creator'
    isAdmin = ADMIN_EMAILS.includes(authUser.email ?? '')
    if (!isAdmin) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from('site_admins')
          .select('email')
          .eq('email', authUser.email ?? '')
          .maybeSingle()
        isAdmin = !!data
      } catch {
        // Table may not exist yet
      }
    }
    photoUrl = profile?.photo_url ?? null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    username = (profile as any)?.username ?? null
  }

  return (
    <header className="sticky top-0 z-40 bg-jungle-900 border-b border-jungle-800 px-6 h-16 flex items-center justify-between relative">
      <Link href="/" className="font-black text-xl text-white font-display">
        jungle<span className="text-jungle-400">gym</span>
      </Link>
      <NavLinks isLoggedIn={!!authUser} isCreator={isCreator} isAdmin={isAdmin} photoUrl={photoUrl} username={username} />
    </header>
  )
}
