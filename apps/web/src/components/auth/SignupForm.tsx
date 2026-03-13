'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export function SignupForm() {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-jungle-800 rounded-2xl p-8 space-y-4 border border-jungle-700">
      {error && (
        <div className="bg-red-900/40 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}
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

const inputClass = 'w-full rounded-lg border border-jungle-700 bg-jungle-900/60 px-3 py-2.5 text-white placeholder:text-jungle-600 text-sm focus:outline-none focus:ring-2 focus:ring-earth-400'
