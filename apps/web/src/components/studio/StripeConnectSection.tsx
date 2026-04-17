'use client'

import { useState, useEffect } from 'react'

type ConnectStatus = 'not_connected' | 'pending' | 'connected' | 'loading'

export function StripeConnectSection({
  initialStatus,
}: {
  initialStatus: 'not_connected' | 'pending' | 'connected'
}) {
  const [status, setStatus] = useState<ConnectStatus>(initialStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If we landed here with ?stripe=complete, check status from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('stripe') === 'complete' && initialStatus !== 'connected') {
      checkStatus()
    }
  }, [initialStatus])

  async function checkStatus() {
    setStatus('loading')
    try {
      const res = await fetch('/api/connect/status')
      const data = await res.json()
      setStatus(data.status ?? 'not_connected')
    } catch {
      setStatus(initialStatus)
    }
  }

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/connect/onboard', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start onboarding')
      // Redirect to Stripe-hosted onboarding
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-4">
      <div>
        <h2 className="font-bold text-stone-900">Payouts</h2>
        <p className="text-sm text-stone-400 mt-0.5">
          Connect your bank account to receive your 80% share of video sales automatically.
        </p>
      </div>

      {error && (
        <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-5 py-4">
          <div className="w-5 h-5 border-2 border-jungle-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-stone-600">Checking your Stripe account...</span>
        </div>
      )}

      {status === 'not_connected' && (
        <>
          <div className="flex items-start gap-3 bg-amber-50 rounded-xl px-5 py-4">
            <span className="text-amber-600 text-lg leading-none mt-0.5">!</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Not connected</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Video sales are held until you connect. Set up takes about 2 minutes.
              </p>
            </div>
          </div>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Redirecting to Stripe...' : 'Connect with Stripe'}
          </button>
          <p className="text-xs text-stone-400 text-center">
            You&apos;ll be redirected to Stripe to enter your bank details securely.
            JungleGym never sees your bank information.
          </p>
        </>
      )}

      {status === 'pending' && (
        <>
          <div className="flex items-start gap-3 bg-amber-50 rounded-xl px-5 py-4">
            <span className="text-amber-600 text-lg leading-none mt-0.5">!</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Setup incomplete</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Stripe needs a bit more information to activate your account.
              </p>
            </div>
          </div>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Redirecting to Stripe...' : 'Continue setup'}
          </button>
        </>
      )}

      {status === 'connected' && (
        <>
          <div className="flex items-start gap-3 bg-jungle-50 rounded-xl px-5 py-4">
            <span className="text-jungle-600 text-lg leading-none mt-0.5">&#10003;</span>
            <div>
              <p className="text-sm font-medium text-jungle-800">Connected</p>
              <p className="text-xs text-jungle-600 mt-0.5">
                Your 80% share of each video sale is deposited to your bank automatically.
              </p>
            </div>
          </div>
          <a
            href="/api/connect/dashboard"
            className="block text-center w-full border border-stone-200 text-stone-700 font-medium py-3 rounded-xl hover:bg-stone-50 transition-colors"
          >
            View Stripe Dashboard
          </a>
          <p className="text-xs text-stone-400 text-center">
            See your payouts, update bank details, and manage your account on Stripe.
          </p>
        </>
      )}
    </div>
  )
}
