'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { MOVEMENT_TYPES } from '@/lib/movement-types'

const MAX_DEMO_BYTES = 500 * 1024 * 1024  // 500 MB (matches bucket limit)

export function ApplyToTeachForm({ userId }: { userId: string }) {
  const [motivation, setMotivation] = useState('')
  const [instagram, setInstagram] = useState('')
  const [youtube, setYoutube] = useState('')
  const [types, setTypes] = useState<string[]>([])
  const [otherChecked, setOtherChecked] = useState(false)
  const [otherText, setOtherText] = useState('')
  const [demoFile, setDemoFile] = useState<File | null>(null)
  const [demoProgress, setDemoProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createBrowserSupabaseClient()

  function toggleType(slug: string) {
    setTypes((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (file && file.size > MAX_DEMO_BYTES) {
      setError('Demo video must be under 500 MB.')
      setDemoFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setError(null)
    setDemoFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (types.length === 0 && !(otherChecked && otherText.trim())) {
      setError('Select at least one movement type.')
      return
    }
    if (otherChecked && !otherText.trim()) {
      setError('Tell us what "Other" means for you, or uncheck it.')
      return
    }
    if (!demoFile) {
      setError('A demo video is required so we can see you move.')
      return
    }

    setLoading(true)
    try {
      // 1. Upload demo video to teacher-applications bucket
      const ext = demoFile.name.split('.').pop()?.toLowerCase() ?? 'mp4'
      const path = `${userId}/demo-${Date.now()}.${ext}`
      setDemoProgress('Uploading demo video…')

      const { error: uploadError } = await supabase.storage
        .from('teacher-applications')
        .upload(path, demoFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: demoFile.type || 'video/mp4',
        })

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
      setDemoProgress(null)

      // 2. Insert application row with the storage path
      const { error: insertError } = await supabase
        .from('teacher_applications')
        .insert({
          user_id: userId,
          motivation: motivation.trim() || null,
          instagram_url: instagram.trim() || null,
          youtube_url: youtube.trim() || null,
          movement_types: types,
          other_movement: otherChecked && otherText.trim() ? otherText.trim() : null,
          demo_video_url: path,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError("You've already submitted an application. We'll be in touch.")
          return
        }
        throw insertError
      }

      setSubmitted(true)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setDemoProgress(null)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-2 shadow-sm">
        <div className="text-4xl mb-2">🌿</div>
        <h2 className="text-xl font-bold text-stone-900">Application received</h2>
        <p className="text-stone-500 text-sm">
          We review each application personally. We&apos;ll reach out to you soon.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-6 sm:p-8 space-y-7 border border-stone-200 shadow-sm"
    >
      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Movement types */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-stone-700">
          What kinds of movement do you teach?
        </legend>
        <p className="text-xs text-stone-400">Pick all that fit.</p>
        <div className="grid grid-cols-2 gap-2">
          {MOVEMENT_TYPES.map((m) => {
            const active = types.includes(m.slug)
            return (
              <button
                key={m.slug}
                type="button"
                onClick={() => toggleType(m.slug)}
                className={`text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                  active
                    ? 'bg-jungle-600 text-white border-jungle-600'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                }`}
              >
                <span className="inline-block w-4 mr-2">{active ? '✓' : ''}</span>
                {m.label}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setOtherChecked((v) => !v)}
            className={`text-left text-sm px-3 py-2 rounded-lg border transition-colors col-span-2 ${
              otherChecked
                ? 'bg-jungle-600 text-white border-jungle-600'
                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
            }`}
          >
            <span className="inline-block w-4 mr-2">{otherChecked ? '✓' : ''}</span>
            Other
          </button>
        </div>
        {otherChecked && (
          <input
            type="text"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            maxLength={80}
            className={inputClass}
            placeholder="e.g. capoeira, krav maga, sound healing…"
          />
        )}
      </fieldset>

      {/* Motivation */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-stone-700">
          What brought you here? <span className="text-stone-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          rows={4}
          maxLength={1000}
          className={`${inputClass} resize-none`}
          placeholder="e.g. I've been teaching yoga and mobility for 8 years and want to share my practice more widely..."
        />
        <p className="text-xs text-stone-400 text-right">{motivation.length}/1000</p>
      </div>

      {/* Links */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1">Instagram</label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className={inputClass}
            placeholder="@yourhandle or full link"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1">YouTube</label>
          <input
            type="text"
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            className={inputClass}
            placeholder="@yourchannel or full link"
          />
        </div>
      </div>

      {/* Demo video */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-stone-700">
          Demo video <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-stone-400">
          1–3 minutes showing you teach or move. MP4, WebM, or MOV. 500 MB max.
        </p>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
            className="w-full text-sm text-stone-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 file:cursor-pointer cursor-pointer"
          />
        </div>
        {demoFile && (
          <p className="text-xs text-jungle-700 mt-1">
            ✓ {demoFile.name} ({Math.round(demoFile.size / 1024 / 1024)} MB)
          </p>
        )}
        {demoProgress && (
          <p className="text-xs text-stone-500 mt-1">{demoProgress}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-earth-400 hover:bg-earth-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Submitting…' : 'Apply to teach'}
      </button>
    </form>
  )
}

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-earth-400'
