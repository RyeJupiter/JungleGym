'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

type Props = {
  userId: string
  supportedRate: number
  communityRate: number
  abundanceRate: number
  suggestedTip: number
}

export function PricingSettingsForm({ userId, supportedRate: initS, communityRate: initC, abundanceRate: initA, suggestedTip: initTip }: Props) {
  const [supportedRate, setSupportedRate] = useState(initS.toString())
  const [communityRate, setCommunityRate] = useState(initC.toString())
  const [abundanceRate, setAbundanceRate] = useState(initA.toString())
  const [suggestedTip, setSuggestedTip] = useState((initTip ?? 5).toString())
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
      setError('Rates must be positive and each tier must be greater than or equal to the previous.')
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          supported_rate: sRate,
          community_rate: cRate,
          abundance_rate: aRate,
          suggested_tip: parseFloat(suggestedTip) || 5,
        })
        .eq('user_id', userId)

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>}
      {saved && <p className="bg-jungle-50 text-jungle-700 rounded-lg px-4 py-3 text-sm">Saved!</p>}

      <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
        <div>
          <h2 className="font-bold text-stone-900">Pricing rates</h2>
          <p className="text-sm text-stone-400 mt-0.5">Dollars per minute of video content. Applied to all future uploads.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Supported', value: supportedRate, onChange: setSupportedRate, hint: '~$1/min' },
            { label: 'Community', value: communityRate, onChange: setCommunityRate, hint: '~$2/min' },
            { label: 'Abundance', value: abundanceRate, onChange: setAbundanceRate, hint: '~$3/min' },
          ].map(({ label, value, onChange, hint }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-stone-500 mb-1">{label} <span className="text-stone-400">{hint}</span></label>
              <input
                type="number" step="0.01" min="0.01" value={value}
                onChange={(e) => onChange(e.target.value)}
                className={inputClass}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-400">
          Prices round down to fun numbers ($1.11, $2.22, $3.33, $4.20...)
        </p>

        <div className="border-t border-stone-200 pt-5 mt-5">
          <label className="block text-sm font-medium text-stone-700 mb-1">Suggested gift amount</label>
          <p className="text-xs text-stone-400 mb-2">Default amount shown in the gift modal for your live sessions.</p>
          <div className="relative max-w-[140px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
            <input
              type="number"
              step="1"
              min="1"
              value={suggestedTip}
              onChange={(e) => setSuggestedTip(e.target.value)}
              className={inputClass + ' pl-7'}
            />
          </div>
        </div>
      </div>

      <button
        type="submit" disabled={loading}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save pricing'}
      </button>
    </form>
  )
}

const inputClass = 'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400'
