'use client'

import { useRef, useState } from 'react'

// Curated Unsplash jungle/rainforest/Costa Rica presets
// Format: images.unsplash.com/photo-{ID}?...
const PRESETS = [
  {
    id: 'jungle-canopy',
    label: 'Jungle Canopy',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'rainforest-floor',
    label: 'Forest Floor',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'aerial-rainforest',
    label: 'Aerial Canopy',
    url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'misty-jungle',
    label: 'Misty Jungle',
    url: 'https://images.unsplash.com/photo-1518791841217-8a12df98ea78?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1518791841217-8a12df98ea78?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'tropical-leaves',
    label: 'Tropical Leaves',
    url: 'https://images.unsplash.com/photo-1535913068-9e5f1a4d09c3?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1535913068-9e5f1a4d09c3?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'costa-rica-waterfall',
    label: 'Waterfall',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'jungle-light',
    label: 'Light Through Trees',
    url: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'ferns',
    label: 'Fern Grotto',
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
    <div className="absolute top-full mt-2 right-0 bg-stone-900 border border-stone-600 rounded-2xl shadow-2xl p-4 w-80 z-50">
      <p className="text-stone-300 text-xs font-semibold uppercase tracking-widest mb-3">Page Background</p>

      {/* Preset grid */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {/* No background */}
        <button
          onClick={() => onSelect(null)}
          className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-colors ${
            !currentBanner ? 'border-jungle-400' : 'border-stone-600 hover:border-stone-400'
          } bg-stone-800`}
          title="No background"
        >
          <span className="text-stone-500 text-xs font-bold">None</span>
        </button>

        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.url)}
            className={`aspect-square rounded-lg border-2 overflow-hidden transition-colors ${
              currentBanner === p.url ? 'border-jungle-400' : 'border-stone-600 hover:border-stone-400'
            }`}
            title={p.label}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.thumb} alt={p.label} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Upload own */}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={isUploading}
        className="w-full bg-stone-800 hover:bg-stone-700 border border-dashed border-stone-600 hover:border-stone-400 text-stone-300 text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {isUploading ? 'Uploading…' : '+ Upload your own photo'}
      </button>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />

      <p className="text-stone-500 text-xs mt-2 text-center">
        Background is darkened automatically so text stays readable.
      </p>
    </div>
  )
}
