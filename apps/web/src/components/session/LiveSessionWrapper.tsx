'use client'

import { useState, useCallback, useRef } from 'react'
import { StreamPlayer } from './StreamPlayer'
import { SessionAutoRefresh } from './SessionAutoRefresh'

/**
 * Client wrapper that connects the auto-refresh poller to the stream player,
 * enabling the BRB overlay when the session is paused.
 *
 * When unpausing, increments a key to force the iframe to remount and
 * reload (with cache-bust) — the CF player doesn't auto-recover after
 * the stream reconnects. Mute state is tracked here so it survives
 * across remounts (viewer doesn't have to re-unmute after BRB).
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

  const handlePausedChange = useCallback((p: boolean) => {
    if (wasPausedRef.current && !p) {
      // Stream resumed — bump key to force iframe reload with cache-bust
      setPlayerKey(k => k + 1)
    }
    wasPausedRef.current = p
    setPaused(p)
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
