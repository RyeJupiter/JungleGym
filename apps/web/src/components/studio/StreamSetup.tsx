'use client'

import { useState } from 'react'
import { BrowserStreamClient } from './BrowserStreamClient'

type Props = {
  sessionId: string
  cfInputId: string | null
  cfStreamKey: string | null
  whipUrl: string | null
  sessionStatus?: string
}

export function StreamSetup({ sessionId, cfInputId, cfStreamKey, whipUrl, sessionStatus }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputId, setInputId] = useState(cfInputId)
  const [streamKey, setStreamKey] = useState(cfStreamKey)
  const [currentWhipUrl, setCurrentWhipUrl] = useState(whipUrl)

  const isProvisioned = !!inputId
  const isCompleted = sessionStatus === 'completed' || sessionStatus === 'cancelled'

  async function handleProvision() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stream/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to set up stream')
      setInputId(data.inputId)
      setStreamKey(data.streamKey)
      if (data.whipUrl) setCurrentWhipUrl(data.whipUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set up stream')
    } finally {
      setLoading(false)
    }
  }

  if (isCompleted) {
    return (
      <div className="bg-gradient-to-br from-jungle-50 to-jungle-100 border border-jungle-200 rounded-2xl p-8 sm:p-12 text-center">
        <p className="text-5xl mb-4">🌿</p>
        <h2 className="text-2xl sm:text-3xl font-black text-jungle-900 mb-2">Thanks for watching!</h2>
        <p className="text-jungle-700">
          {sessionStatus === 'cancelled'
            ? 'This session was cancelled.'
            : 'This session has ended. Hope you enjoyed teaching!'}
        </p>
      </div>
    )
  }

  if (!isProvisioned) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8">
        <h2 className="font-bold text-stone-900 mb-2">Live Streaming</h2>
        <p className="text-sm text-stone-500 mb-6">
          Set up streaming for this session. You&apos;ll be able to go live directly from your browser — no extra software needed.
        </p>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <button
          onClick={handleProvision}
          disabled={loading}
          className="bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Setting up...' : 'Set up stream'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-8">
      <h2 className="font-bold text-stone-900 mb-4">Stream Setup</h2>

      {currentWhipUrl && inputId && streamKey ? (
        <BrowserStreamClient
          sessionId={sessionId}
          cfInputId={inputId}
          cfStreamKey={streamKey}
          whipUrl={currentWhipUrl}
        />
      ) : (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center">
          <p className="text-stone-500 text-sm">
            Browser streaming requires WebRTC support. The WHIP URL is not available for this session — try re-provisioning the stream.
          </p>
        </div>
      )}
    </div>
  )
}
