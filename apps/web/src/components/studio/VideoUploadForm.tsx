'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { calculateTierPrices, formatPrice } from '@junglegym/shared'

export function VideoUploadForm({
  creatorId,
  defaultRates,
}: {
  creatorId: string
  defaultRates: { supported: number; community: number; abundance: number }
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [isFree, setIsFree] = useState(false)
  const [durationSecs, setDurationSecs] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const duration = parseInt(durationSecs) || 0
  const prices = duration > 0 ? calculateTierPrices(duration, defaultRates) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.from('videos').insert({
        creator_id: creatorId,
        title,
        description: description || null,
        tags: tags ? tags.split(',').map((t) => t.trim().toLowerCase()) : [],
        duration_seconds: duration || null,
        is_free: isFree,
        price_supported: (!isFree && prices) ? prices.supported : null,
        price_community: (!isFree && prices) ? prices.community : null,
        price_abundance: (!isFree && prices) ? prices.abundance : null,
        published: false,
      })
      if (error) throw error
      router.push('/studio')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create video')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
      {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          required className={inputClass} placeholder="Kettlebell Swing Masterclass"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          rows={3} className={inputClass}
          placeholder="What will learners take away? What seed are you planting?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Tags</label>
        <input
          type="text" value={tags} onChange={(e) => setTags(e.target.value)}
          className={inputClass} placeholder="strength, kettlebell, beginner"
        />
        <p className="text-xs text-stone-400 mt-1">Comma-separated</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Video duration (seconds)
        </label>
        <input
          type="number" value={durationSecs} onChange={(e) => setDurationSecs(e.target.value)}
          min="1" className={inputClass} placeholder="600"
        />
        <p className="text-xs text-stone-400 mt-1">
          Used to calculate fun prices (~$1–3/min)
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsFree(!isFree)}
          className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
            isFree ? 'bg-jungle-500' : 'bg-stone-300'
          }`}
        >
          <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
            isFree ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </button>
        <span className="text-sm font-medium text-stone-700">Free video</span>
      </div>

      {!isFree && prices && (
        <div className="bg-jungle-50 border border-jungle-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-jungle-800 mb-2">Auto-calculated fun prices</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Supported', price: prices.supported },
              { label: 'Community', price: prices.community },
              { label: 'Abundance', price: prices.abundance },
            ].map(({ label, price }) => (
              <div key={label} className="bg-white rounded-lg p-3 border border-jungle-100">
                <p className="text-xs text-stone-500">{label}</p>
                <p className="font-black text-jungle-800">{formatPrice(price)}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-jungle-600 mt-2">
            You can adjust your default rates in your profile settings.
          </p>
        </div>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save as draft'}
      </button>
      <p className="text-xs text-stone-400 text-center">
        Your video will be saved as a draft. Publish it from the Studio when it&apos;s ready.
      </p>
    </form>
  )
}

const inputClass = 'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400'
