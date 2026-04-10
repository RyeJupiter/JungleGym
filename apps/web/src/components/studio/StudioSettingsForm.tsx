'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

import type { NotificationPref } from '@/hooks/useCreatorNotifications'

type Profile = {
  user_id: string
  display_name: string
  username: string
  bio: string | null
  tagline: string | null
  location: string | null
  tags: string[]
  photo_url: string | null
  supported_rate: number
  community_rate: number
  abundance_rate: number
  suggested_tip: number
  notification_pref: NotificationPref
  notification_threshold: number
  notification_email: string | null
}

export function StudioSettingsForm({ profile }: { profile: Profile }) {
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [tagline, setTagline] = useState(profile.tagline ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [tags, setTags] = useState(profile.tags.join(', '))
  const [photoUrl, setPhotoUrl] = useState(profile.photo_url ?? '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [supportedRate, setSupportedRate] = useState(profile.supported_rate.toString())
  const [communityRate, setCommunityRate] = useState(profile.community_rate.toString())
  const [abundanceRate, setAbundanceRate] = useState(profile.abundance_rate.toString())
  const [suggestedTip, setSuggestedTip] = useState((profile.suggested_tip ?? 5).toString())
  const [notificationPref, setNotificationPref] = useState<NotificationPref>(profile.notification_pref ?? 'every')
  const [notificationThreshold, setNotificationThreshold] = useState(profile.notification_threshold?.toString() ?? '0')
  const [notificationEmail, setNotificationEmail] = useState(profile.notification_email ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
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
      let finalPhotoUrl = photoUrl

      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `${profile.user_id}/avatar.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(path, photoFile, { cacheControl: '3600', upsert: true })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path)
        finalPhotoUrl = publicUrl
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio: bio || null,
          tagline: tagline || null,
          location: location || null,
          tags: tags ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
          photo_url: finalPhotoUrl || null,
          supported_rate: sRate,
          community_rate: cRate,
          abundance_rate: aRate,
          suggested_tip: parseFloat(suggestedTip) || 5,
          notification_pref: notificationPref,
          notification_threshold: parseFloat(notificationThreshold) || 0,
          notification_email: notificationEmail || null,
        })
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</p>}
      {saved && <p className="bg-jungle-50 text-jungle-700 rounded-lg px-4 py-3 text-sm">Saved ✓</p>}

      {/* Identity */}
      <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
        <h2 className="font-bold text-stone-900">Identity</h2>

        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-jungle-100 overflow-hidden flex items-center justify-center text-2xl flex-shrink-0">
            {photoFile
              ? <img src={URL.createObjectURL(photoFile)} alt="" className="w-full h-full object-cover" />
              : photoUrl
              ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
              : '🌿'}
          </div>
          <div>
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} className="hidden" />
            <button type="button" onClick={() => photoInputRef.current?.click()} className="text-sm text-jungle-600 hover:text-jungle-800 font-medium">
              Change photo
            </button>
            <p className="text-xs text-stone-400 mt-0.5">JPG, PNG, WebP · max 5 MB</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Display name *</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Username</label>
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2.5 bg-stone-50 text-sm text-stone-400">
            <span>@{profile.username}</span>
            <span className="text-xs ml-auto">(contact support to change)</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Tagline</label>
          <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputClass} placeholder="Movement educator · Breath coach" />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className={inputClass} placeholder="Tell learners about your practice and your why…" />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="Los Angeles, CA" />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Disciplines / tags</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} placeholder="yoga, breathwork, movement, ideology" />
          <p className="text-xs text-stone-400 mt-1">Comma-separated — used for discovery</p>
        </div>
      </div>

      {/* Pricing rates */}
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
          Prices round down to fun numbers ($1.11, $2.22, $3.33, $4.20…)
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

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
        <div>
          <h2 className="font-bold text-stone-900">Drop-in notifications</h2>
          <p className="text-sm text-stone-400 mt-0.5">How you want to hear when someone drops into your class.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {([
            { value: 'every', label: 'Every sale', emoji: '🎉' },
            { value: 'threshold', label: 'Above $X', emoji: '💰' },
            { value: 'daily', label: 'Daily', emoji: '📅' },
            { value: 'weekly', label: 'Weekly', emoji: '📊' },
            { value: 'off', label: 'Off', emoji: '🔕' },
          ] as const).map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => setNotificationPref(value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                notificationPref === value
                  ? 'border-jungle-500 bg-jungle-50 text-jungle-800'
                  : 'border-stone-200 text-stone-500 hover:border-stone-300'
              }`}
            >
              <span className="text-xl">{emoji}</span>
              {label}
            </button>
          ))}
        </div>

        {notificationPref === 'threshold' && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Notify when drop-in exceeds ($)
            </label>
            <input
              type="number" min="0" step="1" value={notificationThreshold}
              onChange={(e) => setNotificationThreshold(e.target.value)}
              className={inputClass} placeholder="20" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Notification email <span className="text-stone-400 font-normal">(optional — for daily/weekly summaries)</span>
          </label>
          <input
            type="email" value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            className={inputClass} placeholder="you@example.com" />
        </div>
      </div>

      <button
        type="submit" disabled={loading}
        className="w-full bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  )
}

const inputClass = 'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400'
