'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function PurchaseConfirm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  const paymentIntent = searchParams.get('payment_intent')
  const redirectStatus = searchParams.get('redirect_status')

  useEffect(() => {
    if (paymentIntent && redirectStatus === 'succeeded' && !confirming) {
      setConfirming(true)
      fetch('/api/checkout/video/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: paymentIntent }),
      })
        .then(() => {
          // Reload to show unlocked state (strips query params)
          const url = new URL(window.location.href)
          url.search = ''
          router.replace(url.pathname)
          router.refresh()
        })
        .catch(() => {
          router.refresh()
        })
    }
  }, [paymentIntent, redirectStatus, confirming, router])

  if (!paymentIntent || redirectStatus !== 'succeeded') return null

  return (
    <div className="bg-jungle-50 border border-jungle-200 rounded-2xl p-5 text-center mb-8">
      <div className="text-3xl mb-2">✓</div>
      <p className="font-bold text-jungle-800">Payment successful! Unlocking your video...</p>
    </div>
  )
}
