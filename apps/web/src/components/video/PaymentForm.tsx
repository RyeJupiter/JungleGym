'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ videoId }: { videoId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    const siteUrl = window.location.origin
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${siteUrl}/video/${videoId}?purchase=success`,
      },
    })

    // Only reaches here if there's an error — successful payments redirect
    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.')
    }
    setProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {error && (
        <p className="text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {processing ? 'Processing payment…' : 'Pay now'}
      </button>
    </form>
  )
}

export function PaymentForm({ clientSecret, videoId }: { clientSecret: string; videoId: string }) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#16a34a',
            borderRadius: '12px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          },
        },
      }}
    >
      <CheckoutForm videoId={videoId} />
    </Elements>
  )
}
