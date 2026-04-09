'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { PriceInput } from './PriceInput'

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
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>}
      {saved && <p className="bg-jungle-50 text-jungle-700 rounded-lg px-4 py-3 text-sm">Rates saved ✓</p>}

      <section className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
        <div>
          <h2 className="font-bold text-stone-900">Pricing rates</h2>
          <p className="text-sm text-stone-400 mt-0.5">Dollars per minute of video content — applied to all future uploads.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <PriceInput label="🌱 Supported" hint="~$1/min" value={supportedRate} onChange={setSupportedRate} />
          <PriceInput label="🌿 Community" hint="~$2/min" value={communityRate} onChange={setCommunityRate} />
          <PriceInput label="🌳 Abundance" hint="~$3/min" value={abundanceRate} onChange={setAbundanceRate} />
        </div>

        <p className="text-xs text-stone-400">Prices round down to fun numbers ($1.11, $2.22, $3.33, $4.20…)</p>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save rates'}
      </button>
    </form>
  )
}
