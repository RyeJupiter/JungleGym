'use client'

import { useState, useCallback } from 'react'
import { StreamPlayer } from './StreamPlayer'
import { SessionAutoRefresh } from './SessionAutoRefresh'

/**
 * Client wrapper that connects the auto-refresh poller to the stream player.
 *
 * The stream never disconnects during pause — the creator swaps real
 * camera/mic tracks for black video + silence, keeping the WHIP connection
 * alive. This means the CF iframe maintains a continuous connection and
 * viewers get instant resume with no iframe reload needed.
 *
 * Mute state is tracked here so it survives across renders.
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
  const [muted, setMuted] = useState(true)

  const handlePausedChange = useCallback((p: boolean) => {
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
