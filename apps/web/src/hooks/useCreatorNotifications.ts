'use client'

import { useEffect, useRef } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export type NotificationPref = 'every' | 'daily' | 'weekly' | 'threshold' | 'off'

export interface PurchaseEvent {
  id: string
  video_id: string
  amount_paid: number
  tier: 'supported' | 'community' | 'abundance'
  total_amount: number
  created_at: string
}

export function useCreatorNotifications(
  creatorId: string,
  pref: NotificationPref,
  threshold: number,
  onPurchase: (event: PurchaseEvent) => void,
) {
  const onPurchaseRef = useRef(onPurchase)
  onPurchaseRef.current = onPurchase

  useEffect(() => {
    if (pref === 'off' || pref === 'daily' || pref === 'weekly') return

    const supabase = createBrowserSupabaseClient()

    const channel = supabase
      .channel(`creator-purchases-${creatorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchases',
          filter: `video_id=in.(select id from videos where creator_id=eq.${creatorId})`,
        },
        (payload) => {
          const purchase = payload.new as PurchaseEvent
          if (pref === 'threshold' && purchase.amount_paid < threshold) return
          onPurchaseRef.current(purchase)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [creatorId, pref, threshold])
}
