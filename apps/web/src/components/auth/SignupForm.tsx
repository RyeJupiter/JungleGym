'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export function SignupForm() {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/explore'
  const supabase = createBrowserSupabaseClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, role: 'learner' },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      if (signUpError) throw signUpError
      if (data.user) {
        await supabase.from('users').insert({ id: data.user.id, email, role: 'learner' })
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          display_name: displayName,
          username: username.toLowerCase(),
          tags: [],
        })
        setEmailSent(true)
      }
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

  if (emailSent) {
    return (
      <div className="bg-jungle-800 rounded-2xl p-8 space-y-4 border border-jungle-700 text-center">
        <div className="text-4xl">📬</div>
        <h2 className="text-white font-bold text-xl">Check your email</h2>
        <p className="text-jungle-400 text-sm leading-relaxed">
          We sent a confirmation link to <span className="text-jungle-200 font-medium">{email}</span>.
          Click it to activate your account and get into the gym.
        </p>
        <p className="text-jungle-600 text-xs">Didn't get it? Check your spam folder.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-jungle-800 rounded-2xl p-8 space-y-4 border border-jungle-700">
      {error && (
        <div className="bg-red-900/40 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
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
        <label className="block text-sm font-medium text-jungle-300 mb-1">Display name</label>
        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
          required className={inputClass} placeholder="Alex Rivera" />
      </div>
      <div>
        <label className="block text-sm font-medium text-jungle-300 mb-1">Username</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-jungle-500 text-sm">@</span>
          <input type="text" value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required pattern="[a-z0-9_\-]{3,32}" className={`${inputClass} pl-7`}
            placeholder="alexrivera" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-jungle-300 mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          required className={inputClass} placeholder="you@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-jungle-300 mb-1">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          required minLength={8} className={inputClass} placeholder="8+ characters" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-earth-400 hover:bg-earth-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50">
        {loading ? 'Creating account...' : 'Create account'}
      </button>
      <p className="text-center text-sm text-jungle-500">
        Already here?{' '}
        <Link href="/auth/login" className="font-semibold text-jungle-300 hover:text-white transition-colors">Sign in</Link>
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
