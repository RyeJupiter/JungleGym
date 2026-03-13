'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@junglegym/shared'

type Profile = Database['public']['Tables']['profiles']['Row']

export function ProfileForm({ profile, userId }: { profile: Profile | null; userId: string }) {
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    display_name: profile?.display_name ?? '',
    username: profile?.username ?? '',
    bio: profile?.bio ?? '',
    tagline: profile?.tagline ?? '',
    location: profile?.location ?? '',
    tags: profile?.tags?.join(', ') ?? '',
    supported_rate: profile?.supported_rate?.toString() ?? '1',
    community_rate: profile?.community_rate?.toString() ?? '2',
    abundance_rate: profile?.abundance_rate?.toString() ?? '3',
  })

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const updates: Database['public']['Tables']['profiles']['Update'] = {
        display_name: form.display_name,
        username: form.username.toLowerCase(),
        bio: form.bio || null,
        tagline: form.tagline || null,
        location: form.location || null,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
        supported_rate: parseFloat(form.supported_rate) || 1,
        community_rate: parseFloat(form.community_rate) || 2,
        abundance_rate: parseFloat(form.abundance_rate) || 3,
        updated_at: new Date().toISOString(),
      }
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ user_id: userId, ...updates })
      if (upsertError) throw upsertError
      setSuccess(true)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
      {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm">Profile saved!</div>}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Display name">
          <input type="text" value={form.display_name} onChange={(e) => set('display_name', e.target.value)}
            required className={inputClass} placeholder="Alex Rivera" />
        </Field>
        <Field label="Username">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">@</span>
            <input type="text" value={form.username}
              onChange={(e) => set('username', e.target.value.toLowerCase())}
              required pattern="[a-z0-9_\-]{3,32}" className={`${inputClass} pl-7`} placeholder="alexrivera" />
          </div>
        </Field>
      </div>

      <Field label="Tagline">
        <input type="text" value={form.tagline} onChange={(e) => set('tagline', e.target.value)}
          className={inputClass} placeholder="Strength & play for every body" />
      </Field>

      <Field label="Bio">
        <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)}
          rows={3} className={inputClass} placeholder="Tell people about your practice..." />
      </Field>

      <Field label="Location">
        <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)}
          className={inputClass} placeholder="Los Angeles, CA" />
      </Field>

      <Field label="Tags" hint="Disciplines you teach or love — comma-separated">
        <input type="text" value={form.tags} onChange={(e) => set('tags', e.target.value)}
          className={inputClass} placeholder="yoga, strength, mobility, kettlebell" />
      </Field>

      <div>
        <p className="text-sm font-medium text-stone-700 mb-3">
          Pricing defaults ($ per minute of video)
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'supported_rate', label: 'Supported' },
            { key: 'community_rate', label: 'Community' },
            { key: 'abundance_rate', label: 'Abundance' },
          ].map(({ key, label }) => (
            <div key={key} className="text-center">
              <label className="block text-xs text-stone-500 mb-1">{label}</label>
              <input type="number" min="0.01" step="0.01"
                value={form[key as keyof typeof form]}
                onChange={(e) => set(key, e.target.value)}
                className={`${inputClass} text-center`} />
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-400 mt-2">
          Prices auto-round to fun numbers (e.g. $3.33, $6.66, $9.99).
        </p>
      </div>

      <button type="submit" disabled={saving}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
        {saving ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  )
}

const inputClass = 'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-stone-400 mb-1">{hint}</p>}
      {children}
    </div>
  )
}
