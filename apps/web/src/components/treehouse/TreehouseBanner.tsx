'use client'

import { useRef, useState } from 'react'
import type { ThemeKey } from './config'

// Hex values matching each theme's pageBg Tailwind class — used as the arch SVG fill
// so the arch cutout seamlessly blends with the page background
const PAGE_HEX: Record<ThemeKey, string> = {
  jungle: '#0a1c14',   // bg-jungle-900
  earth: '#1c1917',    // bg-stone-900
  midnight: '#020617', // bg-slate-950
  dawn: '#fafaf9',     // bg-stone-50
  stone: '#f5f5f4',    // bg-stone-100
}

// Default gradient when no image is uploaded — richer than the flat page bg
const BANNER_GRADIENT: Record<ThemeKey, string> = {
  jungle:   'linear-gradient(160deg, #0d2a1a 0%, #1a4d30 100%)',
  earth:    'linear-gradient(160deg, #29211e 0%, #44342e 100%)',
  midnight: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)',
  dawn:     'linear-gradient(160deg, #e8f5e9 0%, #c8e6c9 100%)',
  stone:    'linear-gradient(160deg, #dcd9d5 0%, #c9c5c0 100%)',
}

type Props = {
  theme: ThemeKey
  bannerUrl?: string | null
  editing?: boolean
  onUpload?: (file: File) => Promise<string>
  onBannerChange?: (url: string | null) => void
}

export function TreehouseBanner({
  theme,
  bannerUrl,
  editing = false,
  onUpload,
  onBannerChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const pageHex = PAGE_HEX[theme]

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !onUpload || !onBannerChange) return
    e.target.value = ''
    setUploading(true)
    try {
      const url = await onUpload(file)
      onBannerChange(url)
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative w-full overflow-hidden select-none" style={{ height: 200 }}>
      {/* Background: uploaded landscape image or theme gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={
          bannerUrl
            ? { backgroundImage: `url(${bannerUrl})` }
            : { background: BANNER_GRADIENT[theme] }
        }
      />

      {/* Subtle darkening on image banners so the arch blend looks clean */}
      {bannerUrl && <div className="absolute inset-0 bg-black/20" />}

      {/* Arch + vine SVG — positioned at the bottom of the banner */}
      {/* viewBox 1440×72: y=0 is inside the banner, y=72 is the page level */}
      {/* The arch path fills from the bottom up to the curve with the page bg color, */}
      {/* creating the archway cutout. Vine leaves sit along the arch boundary. */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 72 }}>
        <svg
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          width="100%"
          height="72"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* ── Arch fill ── */}
          {/* Gentle parabola: high at center (y≈27), lower at edges (y=50) */}
          <path
            d="M0,72 L0,50 C360,28 1080,28 1440,50 L1440,72 Z"
            fill={pageHex}
          />

          {/* ── Vine leaf clusters along the arch line ── */}
          {/* Each leaf: bezier teardrop, base at (0,0), tip pointing downward */}
          {/* translate positions the base on the arch line; rotate gives natural angles */}

          {/* Left edge  (arch ≈ y48) */}
          <path d="M0,0 C-10,4 -11,9 0,13 C11,9 10,4 0,0"   transform="translate(95,48)  rotate(-20)" fill="#3d9e6b" opacity="0.85" />
          <path d="M0,0 C-7,3 -8,7 0,10 C8,7 7,3 0,0"        transform="translate(112,46) rotate(15)"  fill="#52b788" opacity="0.70" />

          {/* Left-center (arch ≈ y41) */}
          <path d="M0,0 C-12,4 -13,10 0,15 C13,10 12,4 0,0"  transform="translate(270,41) rotate(-35)" fill="#3d9e6b" opacity="0.90" />
          <path d="M0,0 C-10,4 -11,9 0,13 C11,9 10,4 0,0"    transform="translate(286,37) rotate(5)"   fill="#52b788" opacity="0.85" />
          <path d="M0,0 C-7,3 -8,7 0,10 C8,7 7,3 0,0"        transform="translate(302,40) rotate(28)"  fill="#2d6a4f" opacity="0.75" />

          {/* Center-left (arch ≈ y34) */}
          <path d="M0,0 C-12,4 -13,10 0,15 C13,10 12,4 0,0"  transform="translate(448,34) rotate(-22)" fill="#52b788" opacity="0.85" />
          <path d="M0,0 C-10,4 -11,9 0,13 C11,9 10,4 0,0"    transform="translate(463,31) rotate(12)"  fill="#3d9e6b" opacity="0.90" />

          {/* Near-center left (arch ≈ y29) */}
          <path d="M0,0 C-12,4 -13,10 0,15 C13,10 12,4 0,0"  transform="translate(605,29) rotate(-15)" fill="#3d9e6b" opacity="0.90" />
          <path d="M0,0 C-8,3 -9,7 0,11 C9,7 8,3 0,0"        transform="translate(621,27) rotate(22)"  fill="#52b788" opacity="0.80" />

          {/* Center focal — 3 larger leaves (arch ≈ y27) */}
          <path d="M0,0 C-14,5 -15,12 0,17 C15,12 14,5 0,0"  transform="translate(698,27) rotate(-18)" fill="#2d6a4f" opacity="0.95" />
          <path d="M0,0 C-13,5 -14,11 0,16 C14,11 13,5 0,0"  transform="translate(720,25) rotate(0)"   fill="#3d9e6b" opacity="1.00" />
          <path d="M0,0 C-14,5 -15,12 0,17 C15,12 14,5 0,0"  transform="translate(742,27) rotate(20)"  fill="#2d6a4f" opacity="0.95" />

          {/* Near-center right (arch ≈ y29) */}
          <path d="M0,0 C-8,3 -9,7 0,11 C9,7 8,3 0,0"        transform="translate(819,27) rotate(-22)" fill="#52b788" opacity="0.80" />
          <path d="M0,0 C-12,4 -13,10 0,15 C13,10 12,4 0,0"  transform="translate(835,29) rotate(15)"  fill="#3d9e6b" opacity="0.90" />

          {/* Center-right (arch ≈ y34) */}
          <path d="M0,0 C-10,4 -11,9 0,13 C11,9 10,4 0,0"    transform="translate(977,31) rotate(-12)" fill="#3d9e6b" opacity="0.90" />
          <path d="M0,0 C-12,4 -13,10 0,15 C13,10 12,4 0,0"  transform="translate(992,34) rotate(22)"  fill="#52b788" opacity="0.85" />

          {/* Right-center (arch ≈ y41) */}
          <path d="M0,0 C-7,3 -8,7 0,10 C8,7 7,3 0,0"        transform="translate(1138,38) rotate(-28)" fill="#2d6a4f" opacity="0.75" />
          <path d="M0,0 C-10,4 -11,9 0,13 C11,9 10,4 0,0"    transform="translate(1154,41) rotate(-5)"  fill="#52b788" opacity="0.85" />
          <path d="M0,0 C-12,4 -13,10 0,15 C13,10 12,4 0,0"  transform="translate(1170,37) rotate(35)"  fill="#3d9e6b" opacity="0.90" />

          {/* Right edge  (arch ≈ y48) */}
          <path d="M0,0 C-7,3 -8,7 0,10 C8,7 7,3 0,0"        transform="translate(1328,46) rotate(-15)" fill="#52b788" opacity="0.70" />
          <path d="M0,0 C-10,4 -11,9 0,13 C11,9 10,4 0,0"    transform="translate(1345,48) rotate(22)"  fill="#3d9e6b" opacity="0.85" />
        </svg>
      </div>

      {/* ── Edit overlay ── visible on hover when editing=true */}
      {editing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/40">
          {uploading ? (
            <span className="bg-stone-900/90 text-stone-100 text-xs font-medium px-5 py-2.5 rounded-lg">
              Uploading…
            </span>
          ) : (
            <>
              <label className="cursor-pointer bg-white/90 hover:bg-white text-stone-900 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors">
                {bannerUrl ? 'Change photo' : 'Upload banner photo'}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFile}
                />
              </label>
              {bannerUrl && (
                <button
                  type="button"
                  onClick={() => onBannerChange?.(null)}
                  className="bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                  Remove
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
