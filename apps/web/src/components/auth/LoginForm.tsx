'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export function LoginForm() {
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
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/dashboard')
      router.refresh()
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

const inputClass = 'w-full rounded-lg border border-jungle-700 bg-jungle-900/60 px-3 py-2.5 text-white placeholder:text-jungle-600 text-sm focus:outline-none focus:ring-2 focus:ring-earth-400'
