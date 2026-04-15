'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { StreamPlayer } from './StreamPlayer'
import { SessionAutoRefresh } from './SessionAutoRefresh'

/**
 * Client wrapper that connects the auto-refresh poller to the stream player,
 * enabling the BRB overlay when the session is paused.
 *
 * When unpausing, increments a key to force the iframe to remount and
 * reload (with cache-bust) — the CF player doesn't auto-recover after
 * the stream reconnects.
 *
 * Keeps BRB visible for a few seconds after detecting unpause so the
 * CF CDN has time to propagate the resumed stream (without this,
 * desktop browsers can hit a stale CDN edge and show a loading spinner).
 *
 * Mute state is tracked here so it survives across StreamPlayer remounts —
 * viewers don't have to re-unmute after BRB.
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
  const [muted, setMuted] = useState(true)
  const wasPausedRef = useRef(initialPaused)
  const reconnectingRef = useRef(false)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    }
  }, [])

  const handlePausedChange = useCallback((p: boolean) => {
    if (wasPausedRef.current && !p) {
      // Stream resumed — force iframe reload with cache-bust.
      // Keep BRB visible for a few seconds so the CF CDN edge has time
      // to serve the resumed stream (desktop browsers hit this more than mobile).
      setPlayerKey(k => k + 1)
      reconnectingRef.current = true
      reconnectTimerRef.current = setTimeout(() => {
        reconnectingRef.current = false
        reconnectTimerRef.current = null
        setPaused(false)
      }, 3000)
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
          initialMuted={muted}
          onMutedChange={setMuted}
        />
      </div>
    </>
  )
}
