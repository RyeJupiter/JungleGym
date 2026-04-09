'use client'

import { useState, useCallback } from 'react'
import { useCreatorNotifications } from '@/hooks/useCreatorNotifications'
import type { NotificationPref, PurchaseEvent } from '@/hooks/useCreatorNotifications'
import { formatPrice } from '@junglegym/shared'

interface Toast extends PurchaseEvent {
  toastId: string
}

export function PurchaseToast({
  creatorId,
  notificationPref,
  notificationThreshold,
}: {
  creatorId: string
  notificationPref: NotificationPref
  notificationThreshold: number
}) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const handlePurchase = useCallback((event: PurchaseEvent) => {
    const toastId = `${event.id}-${Date.now()}`
    setToasts((prev) => [...prev, { ...event, toastId }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.toastId !== toastId))
    }, 6000)
  }, [])

  useCreatorNotifications(creatorId, notificationPref, notificationThreshold, handlePurchase)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.toastId}
          className="bg-jungle-800 text-white rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-4 pointer-events-auto animate-slide-up max-w-xs"
        >
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-bold text-sm">New drop-in! 🌿</p>
            <p className="text-jungle-300 text-xs mt-0.5">
              {formatPrice(toast.amount_paid)} · {toast.tier}
            </p>
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.toastId !== toast.toastId))}
            className="ml-auto text-jungle-500 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
