'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Responsive Cloudflare Stream player using the CF iframe embed.
 *
 * Uses the CF player's internal postMessage protocol for mute control.
 * The stream never disconnects during pause (creator sends black video +
 * silence instead), so the iframe maintains a continuous connection —
 * no reload or protocol renegotiation needed on resume.
 *
 * Protocol (from CF SDK source):
 * - Iframe sends: { __privateUnstableMessageType: "iframeReady" }
 * - We send:      { __privateUnstableMessageType: "setProperty", property, value }
 */

function cfSetProperty(property: string, value: unknown) {
  return { __privateUnstableMessageType: 'setProperty', property, value }
}

export function StreamPlayer({
  iframeSrc,
  isLive,
  isRecording,
  isPaused,
  initialMuted = true,
  onMutedChange,
}: {
  iframeSrc: string
  isLive?: boolean
  isRecording?: boolean
  isPaused?: boolean
  initialMuted?: boolean
  onMutedChange?: (muted: boolean) => void
}) {
  const [showUnmute, setShowUnmute] = useState(initialMuted)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const readyRef = useRef(false)
  const initialMutedRef = useRef(initialMuted)
  initialMutedRef.current = initialMuted

  // Listen for iframeReady from the CF player, then enforce mute state.
  useEffect(() => {
    readyRef.current = false

    const handleMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return
      if (e.data?.__privateUnstableMessageType === 'iframeReady') {
        readyRef.current = true
        iframeRef.current?.contentWindow?.postMessage(
          cfSetProperty('muted', initialMutedRef.current),
          '*'
        )
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleUnmute = useCallback(() => {
    setShowUnmute(false)
    if (readyRef.current) {
      iframeRef.current?.contentWindow?.postMessage(
        cfSetProperty('muted', false),
        '*'
      )
    }
    onMutedChange?.(false)
  }, [onMutedChange])

  if (!iframeSrc) {
    return (
      <div className="bg-stone-900 rounded-2xl aspect-video flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">📡</p>
          <p className="text-white/70 font-medium">Stream not available</p>
        </div>
      </div>
    )
  }

  // Past session — don't show the CF iframe (which displays a confusing
  // "This stream hasn't started" message). Show a thank-you screen instead.
  if (isRecording) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-jungle-800 to-jungle-950 aspect-video flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-5xl mb-4">🌿</p>
          <p className="text-white text-2xl sm:text-3xl font-black tracking-tight mb-2">Thanks for watching!</p>
          <p className="text-jungle-300 text-sm sm:text-base">This session has ended.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black">
      {/* Live indicator */}
      {isLive && !isPaused && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}
      {isRecording && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-stone-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
          Replay
        </div>
      )}

      {/* BRB overlay when paused */}
      {isPaused && (
        <div className="absolute inset-0 z-20 bg-jungle-950 flex items-center justify-center">
          <div className="text-center">
            <p className="text-5xl mb-4 animate-pulse">🌿</p>
            <p className="text-white text-xl font-black tracking-wide mb-2">Be right back</p>
            <p className="text-white/50 text-sm">The session is taking a short break</p>
          </div>
        </div>
      )}

      {/* Unmute prompt — shown on top of the autoplaying (muted) stream */}
      {showUnmute && isLive && !isPaused && (
        <button
          onClick={handleUnmute}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-[2px] cursor-pointer transition-opacity hover:bg-black/20"
        >
          <div className="bg-white/95 rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3">
            <svg className="w-6 h-6 text-jungle-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
            <span className="text-jungle-800 font-bold text-sm">Tap to unmute</span>
          </div>
        </button>
      )}

      {/* 16:9 responsive iframe */}
      <div className="aspect-video">
        <iframe
          ref={iframeRef}
          src={`${iframeSrc}?autoplay=true&muted=true&preload=true`}
          className="w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}

/**
 * Placeholder shown when streaming is not yet set up for a session.
 */
export function StreamPlaceholder({
  isLive,
  isPast,
  scheduledAt,
}: {
  isLive: boolean
  isPast: boolean
  scheduledAt: string
}) {
  const scheduled = new Date(scheduledAt)
  const msUntilStart = scheduled.getTime() - Date.now()
  const withinHour = msUntilStart > 0 && msUntilStart <= 60 * 60 * 1000
  const pastStart = msUntilStart <= 0

  const dayStr = scheduled.toLocaleDateString(undefined, { weekday: 'long' })
  const timeStr = scheduled.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="bg-jungle-50 border border-jungle-200 rounded-2xl p-8 text-center mb-6">
      <p className="text-4xl mb-3">🌿</p>
      <p className="font-bold text-jungle-800 mb-1">
        {isLive
          ? 'The session is happening now!'
          : isPast
          ? 'This session has ended.'
          : pastStart
          ? "We're running a little behind!"
          : withinHour
          ? 'Session starts soon'
          : 'Live session scheduled'}
      </p>
      {isLive && (
        <p className="text-jungle-600 text-sm">Live streaming is coming soon. For now, connect with the teacher directly.</p>
      )}
      {isPast && (
        <p className="text-jungle-600 text-sm">Thanks for attending! Check out more sessions below.</p>
      )}
      {!isLive && !isPast && !pastStart && !withinHour && (
        <p className="text-jungle-600 text-sm">Come back {dayStr} at {timeStr} to join.</p>
      )}
    </div>
  )
}
