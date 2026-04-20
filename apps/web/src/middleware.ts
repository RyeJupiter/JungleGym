import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PROTECTED_ROUTES = ['/settings', '/studio', '/library', '/apply', '/admin']
const AUTH_ROUTES = ['/auth/login', '/auth/signup']

// Usernames that would collide with real routes or admin-sounding identities.
// Keep in sync with the DB username_format check — these are *additional* blocks.
const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'api', 'auth', 'authentication', 'callback',
  'dashboard', 'settings', 'studio', 'library', 'apply', 'explore', 'classes',
  'welcome', 'sessions', 'session', 'video', 'videos', 'profile', 'profiles',
  'contact', 'membership', 'memberships', 'share', 'shares', 'checkout',
  'connect', 'wallet', 'wallets', 'guides', 'guide', 'treehouse',
  'junglegym', 'support', 'help', 'about', 'terms', 'privacy', 'legal',
  'root', 'system', 'null', 'undefined',
])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rewrite /@username → /username so the [username] route handles it.
  // Lowercased + reserved-name check so usernames can't shadow real routes.
  if (pathname.startsWith('/@')) {
    const raw = pathname.slice(2) // strip "/@"
    const slash = raw.indexOf('/')
    const rawUsername = slash === -1 ? raw : raw.slice(0, slash)
    const rest = slash === -1 ? '' : raw.slice(slash)
    const username = rawUsername.toLowerCase()

    if (!username || RESERVED_USERNAMES.has(username)) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const url = request.nextUrl.clone()
    url.pathname = '/' + username + rest
    return NextResponse.rewrite(url)
  }

  const { response, user } = await updateSession(request)

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/explore', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
