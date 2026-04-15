'use client'

import { useState } from 'react'
import { BrowserStreamClient } from './BrowserStreamClient'

type StreamMode = 'browser' | 'obs'

type Props = {
  sessionId: string
  cfInputId: string | null
  cfStreamKey: string | null
  whipUrl: string | null
}

export function StreamSetup({ sessionId, cfInputId, cfStreamKey, whipUrl }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputId, setInputId] = useState(cfInputId)
  const [streamKey, setStreamKey] = useState(cfStreamKey)
  const [currentWhipUrl, setCurrentWhipUrl] = useState(whipUrl)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState<'url' | 'key' | null>(null)
  const [mode, setMode] = useState<StreamMode>('browser')

  const rtmpsUrl = 'rtmps://live.cloudflare.com:443/live/'
  const isProvisioned = !!inputId

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

  function copyToClipboard(text: string, type: 'url' | 'key') {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!isProvisioned) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8">
        <h2 className="font-bold text-stone-900 mb-2">Live Streaming</h2>
        <p className="text-sm text-stone-500 mb-6">
          Set up streaming for this session. You&apos;ll get an RTMPS URL and stream key
          to paste into OBS or your streaming software.
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
    <div className="bg-white rounded-2xl border border-stone-200 p-8">
      <h2 className="font-bold text-stone-900 mb-4">Stream Setup</h2>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-6 bg-stone-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setMode('browser')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'browser' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Stream from browser
        </button>
        <button
          onClick={() => setMode('obs')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'obs' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Use OBS
        </button>
      </div>

      {mode === 'browser' ? (
        currentWhipUrl && inputId && streamKey ? (
          <BrowserStreamClient
            sessionId={sessionId}
            cfInputId={inputId}
            cfStreamKey={streamKey}
            whipUrl={currentWhipUrl}
          />
        ) : (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center">
            <p className="text-stone-500 text-sm">
              Browser streaming requires WebRTC support. The WHIP URL is not available for this session — try using OBS instead, or re-provision the stream.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {/* RTMPS URL */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">
              RTMPS URL
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 font-mono truncate">
                {rtmpsUrl}
              </code>
              <button
                onClick={() => copyToClipboard(rtmpsUrl, 'url')}
                className="text-xs font-semibold px-3 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors flex-shrink-0"
              >
                {copied === 'url' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Stream Key */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">
              Stream Key
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 font-mono truncate">
                {showKey && streamKey ? streamKey : '••••••••••••••••••••'}
              </code>
              <button
                onClick={() => setShowKey((v) => !v)}
                className="text-xs font-semibold px-3 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors flex-shrink-0"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
              {streamKey && (
                <button
                  onClick={() => copyToClipboard(streamKey, 'key')}
                  className="text-xs font-semibold px-3 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors flex-shrink-0"
                >
                  {copied === 'key' ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-jungle-50 border border-jungle-100 rounded-xl p-4 text-sm text-jungle-700">
            <p className="font-semibold mb-1">How to go live:</p>
            <ol className="list-decimal list-inside space-y-1 text-jungle-600">
              <li>Open OBS (or your streaming app)</li>
              <li>Go to Settings &rarr; Stream</li>
              <li>Set Service to <strong>Custom</strong></li>
              <li>Paste the RTMPS URL and Stream Key above</li>
              <li>Click &ldquo;Start Streaming&rdquo; — your session will go live automatically</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
