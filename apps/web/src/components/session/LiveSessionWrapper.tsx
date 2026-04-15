'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { StreamPlayer } from './StreamPlayer'
import { SessionAutoRefresh } from './SessionAutoRefresh'

/**
 * Client wrapper that connects the auto-refresh poller to the stream player,
 * enabling the BRB overlay when the session is paused.
 *
 * When unpausing, increments a key to force the iframe to remount and
 * reload — the CF player doesn't auto-recover after the stream reconnects.
 */
export function LiveSessionWrapper({
  sessionId,
  currentStatus,
  iframeSrc,
  isLive,
  isRecording,
  initialPaused,
}: {
  sessionId: string
  currentStatus: string
  iframeSrc: string
  isLive: boolean
  isRecording: boolean
  initialPaused: boolean
}) {
  const [paused, setPaused] = useState(initialPaused)
  const [playerKey, setPlayerKey] = useState(0)
  const wasPausedRef = useRef(initialPaused)
  const reconnectingRef = useRef(false)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    }
  }, [])

  const handlePausedChange = useCallback((p: boolean) => {
    if (wasPausedRef.current && !p) {
      // Stream resumed — force iframe reload behind the BRB overlay.
      // Keep BRB visible for a few seconds so CF's CDN has time to
      // propagate the resumed stream before the viewer sees the player.
      setPlayerKey(k => k + 1)
      reconnectingRef.current = true
      reconnectTimerRef.current = setTimeout(() => {
        reconnectingRef.current = false
        reconnectTimerRef.current = null
        setPaused(false)
      }, 4000)
    } else if (!reconnectingRef.current) {
      setPaused(p)
    }
    wasPausedRef.current = p
  }, [])

  return (
    <>
      <SessionAutoRefresh
        sessionId={sessionId}
        currentStatus={currentStatus}
        onPausedChange={handlePausedChange}
      />
      <div className="mb-6">
        <StreamPlayer
          key={playerKey}
          iframeSrc={iframeSrc}
          isLive={isLive}
          isRecording={isRecording}
          isPaused={paused}
        />
      </div>
    </>
  )
}
