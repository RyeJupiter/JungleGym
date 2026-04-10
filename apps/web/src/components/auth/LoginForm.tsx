'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/explore'
  const callbackError = searchParams.get('error')
  const supabase = createBrowserSupabaseClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push(next)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (error) setError(error.message)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-jungle-800 rounded-2xl p-8 space-y-4 border border-jungle-700">
      {(error || callbackError) && (
        <div className="bg-red-900/40 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error ?? (callbackError === 'auth_callback_failed' ? 'Authentication failed. Please try again.' : callbackError)}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-jungle-700" />
        <span className="text-jungle-600 text-xs font-medium">or</span>
        <div className="flex-1 h-px bg-jungle-700" />
      </div>

      <div>
        <label className="block text-sm font-medium text-jungle-300 mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          required className={inputClass} placeholder="you@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-jungle-300 mb-1">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          required className={inputClass} placeholder="••••••••" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-earth-400 hover:bg-earth-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50">
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-jungle-500">
        No account?{' '}
        <Link href="/auth/signup" className="font-semibold text-jungle-300 hover:text-white transition-colors">Join free</Link>
      </p>
    </form>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

const inputClass = 'w-full rounded-lg border border-jungle-700 bg-jungle-900/60 px-3 py-2.5 text-white placeholder:text-jungle-600 text-sm focus:outline-none focus:ring-2 focus:ring-earth-400'
