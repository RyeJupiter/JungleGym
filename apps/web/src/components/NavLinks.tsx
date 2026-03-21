'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from './LogoutButton'

interface Props {
  isLoggedIn: boolean
  isCreator: boolean
  isAdmin: boolean
}

export function NavLinks({ isLoggedIn, isCreator, isAdmin }: Props) {
  const pathname = usePathname()

  function cls(href: string, exact = false) {
    const active = exact ? pathname === href : pathname.startsWith(href)
    return active
      ? 'text-white font-semibold'
      : 'text-jungle-300 hover:text-white transition-colors'
  }

  return (
    <nav className="flex items-center gap-6 text-sm font-medium">
      <Link href="/explore" className={cls('/explore')}>Explore</Link>
      <Link href="/sessions" className={cls('/sessions')}>Sessions</Link>
      {isLoggedIn ? (
        <>
          <Link href="/dashboard" className={cls('/dashboard', true)}>Dashboard</Link>
          {isCreator && <Link href="/studio" className={cls('/studio')}>Studio</Link>}
          {!isCreator && <Link href="/library" className={cls('/library')}>Library</Link>}
          <Link href="/profile" className={cls('/profile')}>Profile</Link>
          {isAdmin && (
            <Link href="/admin" className={`${cls('/admin')} ${pathname.startsWith('/admin') ? '' : 'text-jungle-500'}`}>
              Admin
            </Link>
          )}
          <LogoutButton className="text-jungle-300 hover:text-white transition-colors" />
        </>
      ) : (
        <>
          <Link href="/auth/login" className="text-jungle-300 hover:text-white transition-colors">Sign in</Link>
          <Link
            href="/auth/signup"
            className="bg-earth-400 text-white px-4 py-2 rounded-lg hover:bg-earth-500 transition-colors font-semibold"
          >
            Join
          </Link>
        </>
      )}
    </nav>
  )
}
