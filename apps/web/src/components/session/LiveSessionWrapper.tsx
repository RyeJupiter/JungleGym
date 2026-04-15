'use client'

import { useState, useCallback } from 'react'
import { StreamPlayer } from './StreamPlayer'
import { SessionAutoRefresh } from './SessionAutoRefresh'

/**
 * Client wrapper that connects the auto-refresh poller to the stream player,
 * enabling the BRB overlay when the session is paused.
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
        />
      </div>
    </>
  )
}
