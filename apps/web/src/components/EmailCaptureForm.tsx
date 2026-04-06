'use client'

import { useState } from 'react'

export function EmailCaptureForm({ source = 'homepage' }: { source?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-jungle-300 font-semibold text-center py-4">
        You&apos;re in. We&apos;ll be in touch. 🌿
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-jungle-400 text-sm"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-earth-400 hover:bg-earth-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {status === 'loading' ? 'Saving…' : 'Stay in the loop'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-xs mt-1 text-center w-full">{errorMsg}</p>
      )}
    </form>
  )
}
