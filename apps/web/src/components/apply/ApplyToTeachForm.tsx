'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export function ApplyToTeachForm({ userId }: { userId: string }) {
  const [motivation, setMotivation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: insertError } = await supabase
        .from('teacher_applications')
        .insert({ user_id: userId, motivation: motivation.trim() || null })
      if (insertError) {
        if (insertError.code === '23505') {
          setError("You've already submitted an application. We'll be in touch.")
        } else {
          throw insertError
        }
        return
      }
      setSubmitted(true)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-jungle-800 border border-jungle-700 rounded-2xl p-8 text-center space-y-2">
        <h2 className="text-xl font-bold text-white">Application received</h2>
        <p className="text-jungle-400 text-sm">
          We review each application personally. We'll reach out to you soon.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-jungle-800 rounded-2xl p-8 space-y-6 border border-jungle-700">
      {error && (
        <div className="bg-red-900/40 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-jungle-300">
          What do you teach, and what brought you here? <span className="text-jungle-600 font-normal">(optional)</span>
        </label>
        <textarea
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          rows={5}
          maxLength={1000}
          className="w-full rounded-lg border border-jungle-700 bg-jungle-900/60 px-3 py-2.5 text-white placeholder:text-jungle-600 text-sm focus:outline-none focus:ring-2 focus:ring-earth-400 resize-none"
          placeholder="e.g. I've been teaching yoga and mobility for 8 years and want to share my practice more widely..."
        />
        <p className="text-xs text-jungle-600 text-right">{motivation.length}/1000</p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-earth-400 hover:bg-earth-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Apply to teach'}
      </button>
    </form>
  )
}
