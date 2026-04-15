'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Polls the session status and triggers a server-side refresh when
 * the status changes (e.g. scheduled → live, live → completed).
 * This re-renders the RSC tree without a full page reload.
 */
export function SessionAutoRefresh({
  sessionId,
  currentStatus,
}: {
  sessionId: string
  currentStatus: string
}) {
  const router = useRouter()
  const statusRef = useRef(currentStatus)

  useEffect(() => {
    statusRef.current = currentStatus
  }, [currentStatus])

  useEffect(() => {
    // Only poll when the session could change (scheduled or live)
    if (currentStatus === 'completed' || currentStatus === 'cancelled') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/status`)
        if (!res.ok) return
        const { status } = await res.json()
        if (status !== statusRef.current) {
          statusRef.current = status
          router.refresh()
        }
      } catch {
        // Silently fail — will retry on next interval
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [sessionId, currentStatus, router])

  return null
}
