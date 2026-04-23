'use client'

import { useEffect, useRef, useState } from 'react'
import type { ThemeClasses } from '../themes'

/**
 * Intro-video section.
 *
 * Upload flow is server-side via Cloudflare Stream:
 *   1. Client asks our /api/treehouse/intro-video/upload-url for a
 *      one-time direct-upload URL + Stream UID.
 *   2. Client POSTs the raw file straight to CF Stream — any format,
 *      any size (up to CF's per-upload cap), no in-browser transcode.
 *   3. On upload success the UID is persisted into treehouse_config
 *      immediately via /api/treehouse/intro-video/persist, so leaving
 *      the editor mid-processing no longer loses the upload.
 *   4. Client polls /api/treehouse/intro-video/status until CF reports
 *      readyToStream; playback uses the CF iframe embed.
 *
 * Legacy shape: older uploads stored section.data = { url: '...' }
 * pointing at Supabase storage. Those still render via the <video> tag.
 */

type Props = {
  sectionId: string
  /** New CF Stream upload. */
  streamUid?: string
  /** Legacy Supabase storage URL — pre-CF-Stream migration. */
  legacyUrl?: string
  /** CF customer code for building iframe/HLS URLs. Passed from server. */
  customerCode?: string
  theme: ThemeClasses
  editing?: boolean
  onStreamUidChange?: (uid: string | null) => void
}

type UploadState =
  | { kind: 'idle' }
  | { kind: 'minting' }
  | { kind: 'uploading'; progress: number }
  | { kind: 'processing'; uid: string }
  | { kind: 'error'; message: string }

export function IntroVideoSection({
  sectionId,
  streamUid,
  legacyUrl,
  customerCode,
  theme,
  editing = false,
  onStreamUidChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const [state, setState] = useState<UploadState>({ kind: 'idle' })
  // Once CF finishes processing, we want to render the iframe. Track that
  // separately from state so removing the section while processing still
  // clears the iframe.
  const [ready, setReady] = useState<boolean>(!!streamUid)

  // Reset readiness when the UID changes (remove, replace).
  useEffect(() => {
    setReady(!!streamUid && state.kind !== 'processing')
  }, [streamUid, state.kind])

  // Poll CF Stream status while processing.
  useEffect(() => {
    if (state.kind !== 'processing') return
    const uid = state.uid
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/treehouse/intro-video/status?uid=${encodeURIComponent(uid)}`)
        if (!res.ok) throw new Error('status check failed')
        const s = await res.json()
        if (cancelled) return
        if (s.readyToStream) {
          setReady(true)
          setState({ kind: 'idle' })
          return
        }
        if (s.state === 'error') {
          setState({ kind: 'error', message: s.errorMessage ?? 'Video processing failed.' })
          return
        }
      } catch {
        // Transient — keep polling.
      }
    }

    // Light initial poll then every 4s. CF usually finishes a short intro
    // in 15–45s; 4s keeps the UI responsive without hammering the API.
    poll()
    const t = window.setInterval(poll, 4000)
    return () => {
      cancelled = true
      window.clearInterval(t)
    }
  }, [state])

  async function handleUpload(file: File) {
    // Reset any stuck XHR from a prior attempt.
    xhrRef.current?.abort()
    setState({ kind: 'minting' })

    try {
      // 1) Mint a direct-upload URL.
      const mintRes = await fetch('/api/treehouse/intro-video/upload-url', { method: 'POST' })
      if (!mintRes.ok) {
        const err = await mintRes.json().catch(() => ({}))
        throw new Error(err.error ?? 'Could not start upload')
      }
      const { uploadURL, uid } = await mintRes.json()

      // 2) POST to CF via XHR so we can show progress.
      setState({ kind: 'uploading', progress: 0 })
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr
        xhr.open('POST', uploadURL)
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setState({ kind: 'uploading', progress: ev.loaded / ev.total })
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Upload failed (${xhr.status})`))
        }
        xhr.onerror = () => reject(new Error('Upload network error'))
        xhr.onabort = () => reject(new Error('Upload aborted'))
        const form = new FormData()
        form.append('file', file)
        xhr.send(form)
      })

      // 3) Persist the UID server-side immediately — don't wait for the
      //    editor's Save button. If the creator leaves now, the upload
      //    is still tied to their profile.
      const persistRes = await fetch('/api/treehouse/intro-video/persist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId, streamUid: uid }),
      })
      if (!persistRes.ok) {
        const err = await persistRes.json().catch(() => ({}))
        throw new Error(err.error ?? 'Saved to Cloudflare but could not update profile')
      }

      onStreamUidChange?.(uid)

      // 4) Wait for CF to finish transcoding.
      setState({ kind: 'processing', uid })
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }

  function handleRemove() {
    xhrRef.current?.abort()
    setState({ kind: 'idle' })
    setReady(false)
    onStreamUidChange?.(null)
  }

  const iframeSrc =
    streamUid && customerCode && ready
      ? `https://customer-${customerCode}.cloudflarestream.com/${streamUid}/iframe`
      : null

  // ── View mode — just show the video.
  if (!editing) {
    if (iframeSrc) {
      return (
        <section className="mb-12">
          <div className={`aspect-video w-full rounded-xl border ${theme.cardBorder} overflow-hidden bg-black`}>
            <iframe
              src={iframeSrc}
              className="w-full h-full"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )
    }
    if (legacyUrl) {
      return (
        <section className="mb-12">
          <video
            src={legacyUrl}
            controls
            playsInline
            className={`w-full rounded-xl border ${theme.cardBorder} max-h-[480px] bg-black`}
          />
        </section>
      )
    }
    return null
  }

  const busy = state.kind !== 'idle' && state.kind !== 'error'

  // ── Edit mode
  return (
    <section className="mb-12">
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) handleUpload(file)
        }}
      />

      {(iframeSrc || legacyUrl) && !busy ? (
        <div className="relative">
          {iframeSrc ? (
            <div className={`aspect-video w-full rounded-xl border ${theme.cardBorder} overflow-hidden bg-black`}>
              <iframe
                src={iframeSrc}
                className="w-full h-full"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video
              src={legacyUrl}
              controls
              playsInline
              className={`w-full rounded-xl border ${theme.cardBorder} max-h-[480px] bg-black`}
            />
          )}
          <button
            onClick={handleRemove}
            className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition-colors"
          >
            Remove video
          </button>
        </div>
      ) : busy ? (
        <ProgressPanel state={state} theme={theme} />
      ) : (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            className={`w-full rounded-xl border-2 border-dashed ${theme.cardBorder} ${theme.textMuted} py-16 text-center hover:${theme.cardHoverBorder} transition-colors`}
          >
            <span className="text-4xl block mb-2">🎥</span>
            <span className="text-sm font-semibold">Click to upload an intro video</span>
            <span className="text-xs block mt-1">Any common format — we&rsquo;ll handle the rest</span>
          </button>
          {state.kind === 'error' && (
            <div className="mt-3 flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
              <span className="text-red-400 text-lg leading-none">⚠</span>
              <div className="flex-1 text-sm text-red-200">{state.message}</div>
              <button
                onClick={() => setState({ kind: 'idle' })}
                className="text-red-300 hover:text-red-100 text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function ProgressPanel({ state, theme }: { state: UploadState; theme: ThemeClasses }) {
  const { label, ratio } = describe(state)
  return (
    <div className={`w-full rounded-xl border ${theme.cardBorder} bg-black/20 py-16 px-6 text-center`}>
      <div className="flex items-center justify-center gap-3 mb-4">
        <svg className="animate-spin w-5 h-5 text-jungle-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className={`${theme.textPrimary} text-sm font-semibold`}>{label}</span>
      </div>
      {ratio != null ? (
        <div className="mx-auto max-w-sm">
          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-jungle-500 transition-[width] duration-150"
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </div>
          <div className={`${theme.textMuted} text-xs mt-2`}>{Math.round(ratio * 100)}%</div>
        </div>
      ) : (
        <div className={`${theme.textMuted} text-xs`}>
          Safe to leave this page — we&rsquo;ll finish in the background.
        </div>
      )}
    </div>
  )
}

function describe(state: UploadState): { label: string; ratio: number | null } {
  switch (state.kind) {
    case 'minting':
      return { label: 'Starting upload…', ratio: null }
    case 'uploading':
      return { label: 'Uploading to Cloudflare…', ratio: state.progress }
    case 'processing':
      return { label: 'Processing video…', ratio: null }
    default:
      return { label: '', ratio: null }
  }
}
