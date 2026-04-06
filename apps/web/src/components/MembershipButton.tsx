'use client'

import { useState } from 'react'

export function MembershipButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout/membership', { method: 'POST' })
      const data = await res.json()
      if (res.status === 409) {
        setError("You're already a member!")
        return
      }
      if (res.status === 401) {
        window.location.href = '/auth/login?next=/#membership'
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-center">
      <button
        onClick={handleJoin}
        disabled={loading}
        className="bg-jungle-900 hover:bg-jungle-800 text-white font-bold px-10 py-4 rounded-xl text-lg inline-block transition-colors disabled:opacity-50"
      >
        {loading ? 'Redirecting…' : 'Join the Membership →'}
      </button>
      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      <p className="text-jungle-500 text-xs mt-3">$100 / month · cancel any time</p>
    </div>
  )
}
