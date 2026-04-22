'use client'

import { useRef, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { transcodeToMp4, type TranscodeProgress } from '@/lib/transcodeVideo'
import type { ThemeClasses } from '../themes'

type Props = {
  videoUrl?: string
  theme: ThemeClasses
  editing?: boolean
  userId?: string
  onVideoUploaded?: (url: string) => void
  onVideoRemoved?: () => void
}

type UploadState =
  | { kind: 'idle' }
  | { kind: 'processing'; progress: TranscodeProgress }
  | { kind: 'uploading' }
  | { kind: 'error'; message: string }

const BUCKET_MAX_BYTES = 100 * 1024 * 1024

export function IntroVideoSection({
  videoUrl,
  theme,
  editing = false,
  userId,
  onVideoUploaded,
  onVideoRemoved,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>({ kind: 'idle' })

  async function handleUpload(rawFile: File) {
    if (!userId) return
    try {
      setState({ kind: 'processing', progress: { stage: 'loading-ffmpeg', ratio: 0 } })
      const file = await transcodeToMp4(rawFile, (p) => {
        setState({ kind: 'processing', progress: p })
      })

      if (file.size > BUCKET_MAX_BYTES) {
        const mb = (file.size / 1024 / 1024).toFixed(0)
        setState({
          kind: 'error',
          message: `Even after compression this clip is ${mb} MB — max is 100 MB. Try a shorter video.`,
        })
        return
      }

      setState({ kind: 'uploading' })
      const supabase = createBrowserSupabaseClient()
      const path = `${userId}/${crypto.randomUUID()}.mp4`
      const { error } = await supabase.storage
        .from('intro-videos')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: 'video/mp4' })
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('intro-videos').getPublicUrl(path)
      onVideoUploaded?.(publicUrl)
      setState({ kind: 'idle' })
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }

  // View mode — just show the video
  if (!editing) {
    if (!videoUrl) return null
    return (
      <section className="mb-12">
        <video
          src={videoUrl}
          controls
          playsInline
          className={`w-full rounded-xl border ${theme.cardBorder} max-h-[480px] bg-black`}
        />
      </section>
    )
  }

  const busy = state.kind === 'processing' || state.kind === 'uploading'

  // Edit mode
  return (
    <section className="mb-12">
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) handleUpload(file)
        }}
      />

      {videoUrl && !busy ? (
        <div className="relative">
          <video
            src={videoUrl}
            controls
            playsInline
            className={`w-full rounded-xl border ${theme.cardBorder} max-h-[480px] bg-black`}
          />
          <button
            onClick={() => onVideoRemoved?.()}
            className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition-colors"
          >
            Remove video
          </button>
        </div>
      ) : busy ? (
        <ProgressPanel state={state} theme={theme} />
      ) : (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            className={`w-full rounded-xl border-2 border-dashed ${theme.cardBorder} ${theme.textMuted} py-16 text-center hover:${theme.cardHoverBorder} transition-colors`}
          >
            <span className="text-4xl block mb-2">🎥</span>
            <span className="text-sm font-semibold">Click to upload an intro video</span>
            <span className="text-xs block mt-1">Any common format — we&rsquo;ll convert it</span>
          </button>
          {state.kind === 'error' && (
            <div className="mt-3 flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
              <span className="text-red-400 text-lg leading-none">⚠</span>
              <div className="flex-1 text-sm text-red-200">{state.message}</div>
              <button
                onClick={() => setState({ kind: 'idle' })}
                className="text-red-300 hover:text-red-100 text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function ProgressPanel({ state, theme }: { state: UploadState; theme: ThemeClasses }) {
  const label = statusLabel(state)
  const ratio = state.kind === 'processing' && state.progress.ratio != null
    ? state.progress.ratio
    : null

  return (
    <div className={`w-full rounded-xl border ${theme.cardBorder} bg-black/20 py-16 px-6 text-center`}>
      <div className="flex items-center justify-center gap-3 mb-4">
        <svg className="animate-spin w-5 h-5 text-jungle-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className={`${theme.textPrimary} text-sm font-semibold`}>{label}</span>
      </div>
      {ratio != null ? (
        <div className="mx-auto max-w-sm">
          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-jungle-500 transition-[width] duration-150"
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </div>
          <div className={`${theme.textMuted} text-xs mt-2`}>{Math.round(ratio * 100)}%</div>
        </div>
      ) : (
        <div className={`${theme.textMuted} text-xs`}>This can take a minute on big clips — hang tight.</div>
      )}
    </div>
  )
}

function statusLabel(state: UploadState): string {
  if (state.kind === 'uploading') return 'Uploading…'
  if (state.kind !== 'processing') return ''
  switch (state.progress.stage) {
    case 'loading-ffmpeg': return 'Preparing video processor…'
    case 'transcoding': return 'Compressing video…'
    case 'done': return 'Finishing up…'
  }
}
