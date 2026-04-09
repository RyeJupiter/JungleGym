'use client'

import { useRef, useState, useEffect } from 'react'

type Props = {
  videoSrc: File | string | null
  triggerLabel?: string
  onCapture: (file: File, previewUrl: string) => void
  disabled?: boolean
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VideoThumbnailPicker({ videoSrc, triggerLabel = 'Choose frame from video', onCapture, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // Create / revoke object URL when source is a File
  useEffect(() => {
    if (videoSrc instanceof File) {
      const url = URL.createObjectURL(videoSrc)
      setObjectUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setObjectUrl(null)
  }, [videoSrc])

  const resolvedSrc = videoSrc instanceof File ? objectUrl : videoSrc

  function handleOpen() {
    setReady(false)
    setIsOpen(true)
  }

  function handleScrub(t: number) {
    const v = videoRef.current
    if (!v) return
    v.currentTime = t
    setCurrentTime(t)
  }

  function handleCapture() {
    const v = videoRef.current
    if (!v) return
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    canvas.getContext('2d')?.drawImage(v, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })
      const previewUrl = URL.createObjectURL(file)
      onCapture(file, previewUrl)
      setIsOpen(false)
    }, 'image/jpeg', 0.9)
  }

  if (!videoSrc) return null

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 bg-jungle-50 hover:bg-jungle-100 text-jungle-700 font-semibold text-sm px-4 py-2 rounded-lg border border-jungle-200 hover:border-jungle-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.854v6.292a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
        {triggerLabel}
      </button>

      {isOpen && resolvedSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="font-black text-stone-900 text-lg mb-1">Choose a thumbnail</h3>
            <p className="text-stone-400 text-xs mb-4">Drag the slider to scrub · pause on the frame you want</p>

            <div className="relative mb-3">
              <video
                ref={videoRef}
                src={resolvedSrc}
                crossOrigin="anonymous"
                className="w-full rounded-xl bg-stone-900 aspect-video object-contain"
                muted
                playsInline
                preload="metadata"
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget
                  setDuration(v.duration)
                  v.currentTime = Math.min(Math.max(1, v.duration * 0.1), v.duration - 0.1)
                }}
                onSeeked={(e) => {
                  setCurrentTime(e.currentTarget.currentTime)
                  setReady(true)
                }}
              />
              {/* Loading overlay */}
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-stone-900/80">
                  <svg className="animate-spin w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-stone-400 tabular-nums w-10 flex-shrink-0">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.033}
                value={currentTime}
                onChange={(e) => handleScrub(Number(e.target.value))}
                className="flex-1 accent-jungle-500"
              />
              <span className="text-xs text-stone-400 tabular-nums w-10 flex-shrink-0 text-right">{formatTime(duration)}</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCapture}
                disabled={!ready}
                className="flex-1 bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40"
              >
                Use this frame
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
