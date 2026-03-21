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

  if (authUser) {
    const [{ data: user }, { data: profile }] = await Promise.all([
      supabase.from('users').select('role').eq('id', authUser.id).single(),
      supabase.from('profiles').select('photo_url').eq('user_id', authUser.id).single(),
    ])
    isCreator = user?.role === 'creator'
    isAdmin = ADMIN_EMAILS.includes(authUser.email ?? '')
    photoUrl = profile?.photo_url ?? null
  }

  return (
    <header className="bg-jungle-900 border-b border-jungle-800 px-6 h-16 flex items-center justify-between">
      <Link href="/" className="font-black text-xl text-white">
        jungle<span className="text-jungle-400">gym</span>
      </Link>
      <NavLinks isLoggedIn={!!authUser} isCreator={isCreator} isAdmin={isAdmin} photoUrl={photoUrl} />
    </header>
  )
}
