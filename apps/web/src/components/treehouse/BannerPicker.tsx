'use client'

import { useRef, useState } from 'react'

// Curated Unsplash jungle/rainforest/Costa Rica presets.
// Verified to 200 from images.unsplash.com (2026-04-20).
const PRESETS = [
  {
    id: 'jungle-canopy',
    label: 'Canopy',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'rainforest-floor',
    label: 'Forest floor',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'aerial-rainforest',
    label: 'Aerial',
    url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'jungle-mist',
    label: 'Jungle mist',
    url: 'https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'palm-leaves',
    label: 'Palm leaves',
    url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'costa-rica-waterfall',
    label: 'Waterfall',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'jungle-light',
    label: 'Light rays',
    url: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'ferns',
    label: 'Fern grotto',
    url: 'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?auto=format&fit=crop&w=400&q=60',
  },
]

type Props = {
  currentBanner: string | null | undefined
  onSelect: (url: string | null) => void
  onUpload: (file: File) => Promise<string>  // returns the uploaded URL
  uploading?: boolean
}

export function BannerPicker({ currentBanner, onSelect, onUpload, uploading = false }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [localUploading, setLocalUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setLocalUploading(true)
    try {
      const url = await onUpload(file)
      onSelect(url)
    } finally {
      setLocalUploading(false)
    }
  }

  const isUploading = uploading || localUploading

  return (
    <div
      className="absolute top-full mt-2 right-0 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl p-4 w-80 z-50"
      role="dialog"
      aria-label="Pick a page background"
    >
      <div className="mb-3">
        <p className="text-white text-sm font-bold">Page background</p>
        <p className="text-stone-400 text-xs mt-0.5">
          A subtle photo behind your treehouse. Darkened so text stays readable.
        </p>
      </div>

      {/* Preset grid — 3-col so labels fit comfortably under each tile */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* No background */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-pressed={!currentBanner}
          className={`aspect-[4/3] rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400 ${
            !currentBanner ? 'border-jungle-400' : 'border-stone-600 hover:border-stone-400'
          } bg-stone-800`}
        >
          <span className="text-stone-500 text-[10px] font-bold uppercase tracking-wider">None</span>
        </button>

        {PRESETS.map((p) => {
          const selected = currentBanner === p.url
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.url)}
              aria-pressed={selected}
              aria-label={`Use ${p.label} as page background`}
              title={p.label}
              className={`relative aspect-[4/3] rounded-lg border-2 overflow-hidden transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400 ${
                selected ? 'border-jungle-400' : 'border-stone-600 hover:border-stone-400'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumb} alt="" loading="lazy" className="w-full h-full object-cover" />
              <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-1.5 py-1 text-[10px] font-semibold text-white text-left leading-tight">
                {p.label}
              </span>
              {selected && (
                <span
                  aria-hidden
                  className="absolute top-1 right-1 w-4 h-4 rounded-full bg-jungle-400 border border-jungle-900 flex items-center justify-center text-[9px] text-jungle-900 font-black"
                >
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Upload own */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={isUploading}
        className="w-full bg-stone-800 hover:bg-stone-700 border border-dashed border-stone-600 hover:border-stone-400 text-stone-300 text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400"
      >
        {isUploading ? 'Uploading…' : '+ Upload your own photo'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
