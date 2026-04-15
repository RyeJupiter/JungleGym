'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Polls the session status and triggers a server-side refresh when
 * the status changes. Also tracks paused state for the BRB overlay.
 */
export function SessionAutoRefresh({
  sessionId,
  currentStatus,
  onPausedChange,
}: {
  sessionId: string
  currentStatus: string
  onPausedChange?: (paused: boolean) => void
}) {
  const router = useRouter()
  const statusRef = useRef(currentStatus)
  const pausedRef = useRef(false)

  useEffect(() => {
    statusRef.current = currentStatus
  }, [currentStatus])

  useEffect(() => {
    if (currentStatus === 'completed' || currentStatus === 'cancelled') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/status`)
        if (!res.ok) return
        const { status, paused } = await res.json()

        if (paused !== pausedRef.current) {
          pausedRef.current = paused
          onPausedChange?.(paused)
        }

        if (status !== statusRef.current) {
          statusRef.current = status
          router.refresh()
        }
      } catch {
        // Will retry on next interval
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [sessionId, currentStatus, router, onPausedChange])

  return null
}
