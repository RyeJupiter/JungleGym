'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { LogoutButton } from './LogoutButton'

interface Props {
  isLoggedIn: boolean
  isCreator: boolean
  isAdmin: boolean
  photoUrl: string | null
}

export function NavLinks({ isLoggedIn, isCreator, isAdmin, photoUrl }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  function cls(href: string) {
    return pathname.startsWith(href)
      ? 'text-white font-semibold'
      : 'text-jungle-300 hover:text-white transition-colors'
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav className="flex items-center gap-6 text-sm font-medium">
      <Link href="/explore" className={cls('/explore')}>Explore</Link>
      <Link href="/sessions" className={cls('/sessions')}>Sessions</Link>

      {isLoggedIn ? (
        <>
          <Link href="/library" className={cls('/library')}>Library</Link>
          {isCreator && <Link href="/studio" className={cls('/studio')}>Studio</Link>}

          {/* Profile picture dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-jungle-600 hover:border-jungle-400 transition-colors focus:outline-none focus:border-jungle-400 flex-shrink-0"
              aria-label="Account menu"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-jungle-700 flex items-center justify-center text-jungle-300 text-xs font-bold">
                  🌿
                </div>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-44 bg-jungle-800 border border-jungle-700 rounded-xl shadow-xl overflow-hidden z-50">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm text-jungle-200 hover:bg-jungle-700 transition-colors"
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-jungle-500 hover:bg-jungle-700 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <div className="border-t border-jungle-700">
                  <LogoutButton className="w-full text-left px-4 py-3 text-sm text-jungle-400 hover:bg-jungle-700 hover:text-jungle-200 transition-colors" />
                </div>
              </div>
            )}
          </div>
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
