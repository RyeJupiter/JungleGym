'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

type Profile = {
  user_id: string
  username: string
  supported_rate: number
  community_rate: number
  abundance_rate: number
}

export function StudioSettingsForm({ profile }: { profile: Profile }) {
  const [supportedRate, setSupportedRate] = useState(profile.supported_rate.toString())
  const [communityRate, setCommunityRate] = useState(profile.community_rate.toString())
  const [abundanceRate, setAbundanceRate] = useState(profile.abundance_rate.toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    const sRate = parseFloat(supportedRate)
    const cRate = parseFloat(communityRate)
    const aRate = parseFloat(abundanceRate)

    if (sRate <= 0 || cRate < sRate || aRate < cRate) {
      setError('Rates must be positive and each tier ≥ the previous.')
      setLoading(false)
      return
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('profiles') as any)
        .update({ supported_rate: sRate, community_rate: cRate, abundance_rate: aRate })
        .eq('user_id', profile.user_id)

      if (updateError) throw updateError
      setSaved(true)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Profile identity CTA */}
      <div className="bg-jungle-50 border border-jungle-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-jungle-900">Profile identity</p>
          <p className="text-xs text-jungle-600 mt-0.5">Name, photo, bio, tags, and location are edited on your Treehouse.</p>
        </div>
        <Link
          href={`/@${profile.username}?edit=true`}
          className="flex-shrink-0 bg-jungle-700 hover:bg-jungle-600 text-jungle-100 text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          Edit Treehouse →
        </Link>
      </div>

      {/* Pricing rates */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>}
        {saved && <p className="bg-jungle-50 text-jungle-700 rounded-lg px-4 py-3 text-sm">Rates saved ✓</p>}

        <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
          <div>
            <h2 className="font-bold text-stone-900">Pricing rates</h2>
            <p className="text-sm text-stone-400 mt-0.5">Dollars per minute of video content. Applied to all future uploads.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Supported', emoji: '🌱', hint: '~$1/min', value: supportedRate, onChange: setSupportedRate },
              { label: 'Community', emoji: '🌿', hint: '~$2/min', value: communityRate, onChange: setCommunityRate },
              { label: 'Abundance', emoji: '🌳', hint: '~$3/min', value: abundanceRate, onChange: setAbundanceRate },
            ].map(({ label, emoji, hint, value, onChange }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  {emoji} {label} <span className="text-stone-400">{hint}</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400">
            Prices round down to fun numbers ($1.11, $2.22, $3.33, $4.20…)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save rates'}
        </button>
      </form>
    </div>
  )
}

const inputClass = 'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400'
