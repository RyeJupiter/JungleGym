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
  username: string | null
}

export function NavLinks({ isLoggedIn, isCreator, isAdmin, photoUrl, username }: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  function cls(href: string) {
    return pathname.startsWith(href)
      ? 'text-white font-semibold'
      : 'text-jungle-300 hover:text-white transition-colors'
  }

  function mobileClsBlock(href: string) {
    return `block px-4 py-3 text-base font-medium rounded-xl transition-colors ${
      pathname.startsWith(href)
        ? 'text-white bg-jungle-700'
        : 'text-jungle-200 hover:bg-jungle-700 hover:text-white'
    }`
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <Link href="/explore" className={cls('/explore')}>Classes</Link>
        <Link href="/guides" className={cls('/guides')}>Guides</Link>
        <Link href="/sessions" className={cls('/sessions')}>Live</Link>

        {isLoggedIn ? (
          <>
            <Link href="/library" className={cls('/library')}>Library</Link>
            {isCreator && <Link href="/studio" className={cls('/studio')}>Studio</Link>}

            {/* Profile picture dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
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

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-jungle-800 border border-jungle-700 rounded-xl shadow-xl overflow-hidden z-50">
                  {username && (
                    <Link
                      href={`/@${username}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-jungle-200 hover:bg-jungle-700 transition-colors"
                    >
                      My Profile
                    </Link>
                  )}
                  {isAdmin && (
                    <>
                      <div className="border-t border-jungle-700" />
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-jungle-500 hover:bg-jungle-700 transition-colors"
                      >
                        Admin
                      </Link>
                    </>
                  )}
                  <div className="border-t border-jungle-700">
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-jungle-400 hover:bg-jungle-700 hover:text-jungle-200 transition-colors"
                    >
                      Settings
                    </Link>
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

      {/* Mobile hamburger button */}
      <button
        className="md:hidden text-jungle-300 hover:text-white transition-colors p-1"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Open menu"
      >
        {menuOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-jungle-900 border-b border-jungle-800 z-50 px-4 py-4 space-y-1 shadow-xl">
          <Link href="/explore" className={mobileClsBlock('/explore')}>Classes</Link>
          <Link href="/guides" className={mobileClsBlock('/guides')}>Guides</Link>
          <Link href="/sessions" className={mobileClsBlock('/sessions')}>Live</Link>

          {isLoggedIn ? (
            <>
              <Link href="/library" className={mobileClsBlock('/library')}>Library</Link>
              {isCreator && <Link href="/studio" className={mobileClsBlock('/studio')}>Studio</Link>}
              <div className="border-t border-jungle-800 mt-2 pt-2 space-y-1">
                {username && (
                  <Link href={`/@${username}`} className={mobileClsBlock(`/@${username}`)}>My Profile</Link>
                )}
                {isAdmin && <Link href="/admin" className={mobileClsBlock('/admin')}>Admin</Link>}
                <Link href="/settings" className={mobileClsBlock('/settings')}>Settings</Link>
                <LogoutButton className="block w-full text-left px-4 py-3 text-base font-medium text-jungle-400 hover:bg-jungle-700 hover:text-jungle-200 rounded-xl transition-colors" />
              </div>
            </>
          ) : (
            <div className="border-t border-jungle-800 mt-2 pt-2 space-y-1">
              <Link href="/auth/login" className={mobileClsBlock('/auth/login')}>Sign in</Link>
              <Link href="/auth/signup" className="block px-4 py-3 text-base font-semibold text-white bg-earth-400 hover:bg-earth-500 rounded-xl transition-colors text-center">
                Join free
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  )
}
