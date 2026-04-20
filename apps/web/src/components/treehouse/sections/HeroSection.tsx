'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { AvatarCropModal } from '@/components/AvatarCropModal'
import { convertHeicIfNeeded } from '@/lib/compressImage'
import { safeExternalUrl } from '@/lib/safeUrl'
import type { ThemeClasses } from '../themes'
import type { HeroVariant } from '../config'

type ProfileData = {
  display_name: string
  username: string
  photo_url: string | null
  tagline: string | null
  bio: string | null
  location: string | null
  tags: string[]
  supported_rate: number
  community_rate: number
  abundance_rate: number
  instagram_url: string | null
  website_url: string | null
}

type HeroProps = {
  profile: ProfileData
  videoCount: number
  hasLiveSession: boolean
  hasPaidVideos: boolean
  isOwnProfile: boolean
  theme: ThemeClasses
  variant: HeroVariant
  bannerUrl?: string | null
  editing?: boolean
  onFieldChange?: (field: string, value: string) => void
  onPhotoChange?: (file: File | null, previewUrl: string | null) => void
}

export function HeroSection({
  profile,
  videoCount,
  hasLiveSession,
  hasPaidVideos,
  isOwnProfile,
  theme,
  variant,
  bannerUrl,
  editing = false,
  onFieldChange,
  onPhotoChange,
}: HeroProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [converting, setConverting] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setConverting(true)
    try {
      const ready = await convertHeicIfNeeded(file)
      setCropFile(ready)
    } finally {
      setConverting(false)
    }
  }

  function handleCropConfirm(croppedFile: File) {
    setCropFile(null)
    const previewUrl = URL.createObjectURL(croppedFile)
    onPhotoChange?.(croppedFile, previewUrl)
  }

  const cropModal = cropFile ? (
    <AvatarCropModal
      file={cropFile}
      onConfirm={handleCropConfirm}
      onCancel={() => setCropFile(null)}
    />
  ) : null

  const convertingBanner = converting ? (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 text-stone-100 text-sm font-medium px-5 py-3 rounded-xl shadow-xl max-w-sm text-center backdrop-blur-sm flex items-center gap-3">
      <svg className="animate-spin w-4 h-4 text-jungle-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      Converting photo…
    </div>
  ) : null

  if (variant === 'compact') {
    return (
      <>
      <div
        className={`relative ${!bannerUrl ? theme.heroBg : ''}`}
        style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center top' } : undefined}
      >
        {bannerUrl && <div className="absolute inset-0 bg-black/45" />}
        {bannerUrl && (
          <div
            className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, transparent, ${theme.pageBgHex})` }}
          />
        )}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className={`relative flex-shrink-0${editing ? ' group cursor-pointer' : ''}`}
              onClick={editing ? () => photoInputRef.current?.click() : undefined}
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-jungle-700 border-2 border-jungle-500/40 flex items-center justify-center">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl select-none">🌿</span>
                )}
              </div>
              {editing && (
                <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
                  <span className="text-white text-xs font-semibold">{profile.photo_url ? 'Change' : 'Add photo'}</span>
                  {profile.photo_url && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); onPhotoChange?.(null, null) }} className="text-red-300 text-xs hover:text-red-200">
                      Remove
                    </button>
                  )}
                </div>
              )}
              {editing && <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />}
            </div>

            {/* Identity inline */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <EditableText
                  tag="h1"
                  className={`text-2xl font-black ${theme.textPrimary} leading-tight`}
                  value={profile.display_name}
                  editing={editing}
                  onChange={(v) => onFieldChange?.('display_name', v)}
                />
                <span className={`${theme.accent} text-sm font-medium`}>@{profile.username}</span>
                {profile.tagline && (
                  <>
                    <span className={`${theme.textMuted} text-sm`}>·</span>
                    <EditableText
                      tag="span"
                      className={`${theme.textSecondary} text-sm italic`}
                      value={profile.tagline}
                      editing={editing}
                      onChange={(v) => onFieldChange?.('tagline', v)}
                      prefix="&ldquo;"
                      suffix="&rdquo;"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Edit CTA */}
            {isOwnProfile && !editing && (
              <div className="flex-shrink-0">
                <Link
                  href={`/@${profile.username}?edit=true`}
                  className="bg-jungle-700 hover:bg-jungle-600 text-jungle-200 text-xs font-semibold px-4 py-2 rounded-lg border border-jungle-600 transition-colors"
                >
                  Edit treehouse
                </Link>
              </div>
            )}
          </div>

          {/* Meta + social rows — available in edit mode on every variant so creators can always update links */}
          {(editing || profile.location || profile.tags?.length > 0) && (
            <div className="mt-3">
              <MetaRow profile={profile} theme={theme} editing={editing} onFieldChange={onFieldChange} />
            </div>
          )}
          {(editing || profile.instagram_url || profile.website_url) && (
            <SocialRow profile={profile} theme={theme} editing={editing} onFieldChange={onFieldChange} />
          )}
        </div>
      </div>
      {cropModal}
      {convertingBanner}
      </>
    )
  }

  if (variant === 'centered') {
    return (
      <>
      <div
        className={`relative ${!bannerUrl ? theme.heroBg : ''} ${bannerUrl ? 'sm:min-h-[320px]' : ''}`}
        style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center top' } : undefined}
      >
        {!bannerUrl && <HeroOverlay theme={theme} />}
        {bannerUrl && <div className="absolute inset-0 bg-black/45" />}
        {bannerUrl && (
          <div
            className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, transparent, ${theme.pageBgHex})` }}
          />
        )}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
          {/* Avatar centered */}
          <div className="flex justify-center mb-4">
            <div
              className={`relative${editing ? ' group cursor-pointer' : ''}`}
              onClick={editing ? () => photoInputRef.current?.click() : undefined}
            >
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-jungle-700 border-2 border-jungle-500/40 shadow-xl flex items-center justify-center">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl select-none">🌿</span>
                )}
              </div>
              {hasLiveSession && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-jungle-800" title="Live now" />
              )}
              {editing && (
                <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
                  <span className="text-white text-xs font-semibold">{profile.photo_url ? 'Change' : 'Add photo'}</span>
                  {profile.photo_url && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); onPhotoChange?.(null, null) }} className="text-red-300 text-xs hover:text-red-200">
                      Remove
                    </button>
                  )}
                </div>
              )}
              {editing && <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />}
            </div>
          </div>

          <EditableText
            tag="h1"
            className={`text-3xl sm:text-4xl font-black ${theme.textPrimary} leading-tight mb-1`}
            value={profile.display_name}
            editing={editing}
            onChange={(v) => onFieldChange?.('display_name', v)}
          />
          <p className={`${theme.accent} text-sm font-medium mb-3`}>@{profile.username}</p>

          {(profile.tagline || editing) && (
            <EditableText
              tag="p"
              className={`${theme.textSecondary} text-base italic mb-4 leading-snug max-w-xl mx-auto`}
              value={profile.tagline ?? ''}
              editing={editing}
              onChange={(v) => onFieldChange?.('tagline', v)}
              placeholder="Add a tagline..."
              prefix="&ldquo;"
              suffix="&rdquo;"
            />
          )}

          {(profile.bio || editing) && (
            <EditableText
              tag="p"
              className={`${theme.textSecondary} text-sm leading-relaxed max-w-2xl mx-auto mb-4`}
              value={profile.bio ?? ''}
              editing={editing}
              onChange={(v) => onFieldChange?.('bio', v)}
              placeholder="Write your bio..."
            />
          )}

          <MetaRow profile={profile} theme={theme} editing={editing} onFieldChange={onFieldChange} centered />
          <SocialRow profile={profile} theme={theme} editing={editing} onFieldChange={onFieldChange} centered />

          {isOwnProfile && !editing && (
            <div className="mt-4">
              <Link
                href={`/@${profile.username}?edit=true`}
                className="inline-block bg-jungle-700 hover:bg-jungle-600 text-jungle-200 text-xs font-semibold px-4 py-2 rounded-lg border border-jungle-600 transition-colors"
              >
                Edit treehouse
              </Link>
            </div>
          )}
        </div>
      </div>
      {cropModal}
      {convertingBanner}
      </>
    )
  }

  // ── Default variant (current layout) ──
  return (
    <div
      className={`relative ${!bannerUrl ? theme.heroBg : ''} ${bannerUrl ? 'sm:min-h-[320px]' : ''}`}
      style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center top' } : undefined}
    >
      {!bannerUrl && <HeroOverlay theme={theme} />}
      {bannerUrl && <div className="absolute inset-0 bg-black/45" />}
      {bannerUrl && (
        <div
          className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
          style={{ background: `linear-gradient(to bottom, transparent, ${theme.pageBgHex})` }}
        />
      )}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Treehouse label */}
        <div className="flex items-center gap-2 mb-6">
          <span className={`${theme.accent} text-xs font-bold uppercase tracking-widest`}>Treehouse</span>
          <span className={`${theme.textMuted} text-xs`}>·</span>
          <span className={`${theme.textMuted} text-xs`}>@{profile.username}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div
            className={`relative flex-shrink-0${editing ? ' group cursor-pointer' : ''}`}
            onClick={editing ? () => photoInputRef.current?.click() : undefined}
          >
            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-jungle-700 border-2 border-jungle-500/40 shadow-xl flex items-center justify-center">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl select-none">🌿</span>
              )}
            </div>
            {hasLiveSession && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-jungle-800" title="Live now" />
            )}
            {editing && (
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
                <span className="text-white text-xs font-semibold">{profile.photo_url ? 'Change' : 'Add photo'}</span>
                {profile.photo_url && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); onPhotoChange?.(null, null) }} className="text-red-300 text-xs hover:text-red-200">
                    Remove
                  </button>
                )}
              </div>
            )}
            {editing && <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <EditableText
              tag="h1"
              className={`text-3xl sm:text-4xl font-black ${theme.textPrimary} leading-tight mb-1`}
              value={profile.display_name}
              editing={editing}
              onChange={(v) => onFieldChange?.('display_name', v)}
            />
            <p className={`${theme.accent} text-sm font-medium mb-3`}>@{profile.username}</p>

            {(profile.tagline || editing) && (
              <EditableText
                tag="p"
                className={`${theme.textSecondary} text-base italic mb-4 leading-snug max-w-xl`}
                value={profile.tagline ?? ''}
                editing={editing}
                onChange={(v) => onFieldChange?.('tagline', v)}
                placeholder="Add a tagline..."
                prefix="&ldquo;"
                suffix="&rdquo;"
              />
            )}

            {(profile.bio || editing) && (
              <EditableText
                tag="p"
                className={`${theme.textSecondary} text-sm leading-relaxed max-w-2xl mb-4`}
                value={profile.bio ?? ''}
                editing={editing}
                onChange={(v) => onFieldChange?.('bio', v)}
                placeholder="Write your bio..."
              />
            )}

            <MetaRow profile={profile} theme={theme} editing={editing} onFieldChange={onFieldChange} />
            <SocialRow profile={profile} theme={theme} editing={editing} onFieldChange={onFieldChange} />
          </div>

          {/* Edit CTA */}
          {isOwnProfile && !editing && (
            <div className="flex-shrink-0">
              <Link
                href={`/@${profile.username}?edit=true`}
                className="bg-jungle-700 hover:bg-jungle-600 text-jungle-200 text-xs font-semibold px-4 py-2 rounded-lg border border-jungle-600 transition-colors"
              >
                Edit treehouse
              </Link>
            </div>
          )}
        </div>
      </div>
      {cropModal}
      {convertingBanner}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function HeroOverlay({ theme }: { theme: ThemeClasses }) {
  return (
    <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className={`absolute -top-8 -left-8 w-64 h-64 rounded-full ${theme.heroOverlayDot} blur-3xl`} />
      <div className={`absolute top-0 right-1/4 w-48 h-48 rounded-full ${theme.heroOverlayDot} blur-3xl`} />
      <div className={`absolute -bottom-8 right-0 w-72 h-72 rounded-full ${theme.heroOverlayDot} blur-3xl`} />
    </div>
  )
}

function MetaRow({
  profile,
  theme,
  editing,
  onFieldChange,
  centered = false,
}: {
  profile: ProfileData
  theme: ThemeClasses
  editing?: boolean
  onFieldChange?: (field: string, value: string) => void
  centered?: boolean
}) {
  if (editing) {
    return (
      <div className={`flex flex-wrap items-center gap-3 mt-1 ${centered ? 'justify-center' : ''}`}>
        <span className={`${theme.accent} text-xs flex items-center gap-1`}>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            type="text"
            defaultValue={profile.location ?? ''}
            onBlur={(e) => onFieldChange?.('location', e.currentTarget.value)}
            placeholder="Add location…"
            className="bg-transparent border-b border-dashed border-current/50 focus:outline-none focus:border-current text-xs w-32 placeholder-current/40"
          />
        </span>
        <span className={`${theme.textMuted} text-xs`}>·</span>
        <span className={`${theme.textSecondary} text-xs flex items-center gap-1`}>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <input
            type="text"
            defaultValue={profile.tags?.join(', ') ?? ''}
            onBlur={(e) => onFieldChange?.('tags', e.currentTarget.value)}
            placeholder="yoga, strength, mobility…"
            className="bg-transparent border-b border-dashed border-current/50 focus:outline-none focus:border-current text-xs w-48 placeholder-current/40"
          />
        </span>
      </div>
    )
  }

  if (!profile.location && !profile.tags?.length) return null

  return (
    <div className={`flex flex-wrap items-center gap-2 ${centered ? 'justify-center' : ''}`}>
      {profile.location && (
        <span className={`${theme.accent} text-xs flex items-center gap-1`}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {profile.location}
        </span>
      )}
      {profile.location && profile.tags?.length > 0 && (
        <span className={`${theme.textMuted} text-xs`}>·</span>
      )}
      {profile.tags?.map((tag: string) => (
        <Link
          key={tag}
          href={`/explore?tag=${encodeURIComponent(tag)}`}
          className={`${theme.cardBg} ${theme.cardHoverBorder} ${theme.textSecondary} text-xs font-semibold px-3 py-1 rounded-full transition-colors capitalize`}
        >
          {tag}
        </Link>
      ))}
    </div>
  )
}

function RatesBar({
  rates,
  theme,
  className = '',
  editing,
  onFieldChange,
}: {
  rates: { supported: number; community: number; abundance: number }
  theme: ThemeClasses
  className?: string
  editing?: boolean
  onFieldChange?: (field: string, value: string) => void
}) {
  return (
    <div className={`flex flex-wrap gap-3 items-center ${className}`}>
      <span className={`${theme.textMuted} text-xs font-semibold uppercase tracking-wide`}>Rates:</span>
      {[
        { emoji: '🌱', label: 'Supported', rate: rates.supported, field: 'supported_rate' },
        { emoji: '🌿', label: 'Community', rate: rates.community, field: 'community_rate' },
        { emoji: '🌳', label: 'Abundance', rate: rates.abundance, field: 'abundance_rate' },
      ].map(({ emoji, label, rate, field }) => (
        <span
          key={label}
          className={`flex items-center gap-1.5 ${theme.cardBg} border ${theme.cardBorder} ${theme.textSecondary} text-xs font-medium px-3 py-1.5 rounded-lg`}
        >
          {emoji}
          <span className={theme.textMuted}>{label}</span>
          {editing ? (
            <>
              <span className={`${theme.textMuted} text-xs`}>$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={rate.toFixed(2)}
                onBlur={(e) => onFieldChange?.(field, e.currentTarget.value)}
                className={`w-12 bg-transparent border-b border-dashed border-current/50 focus:outline-none focus:border-current ${theme.textPrimary} font-bold text-xs text-right`}
              />
              <span className={`${theme.textMuted} text-xs`}>/min</span>
            </>
          ) : (
            <span className={`${theme.textPrimary} font-bold`}>${rate.toFixed(2)}/min</span>
          )}
        </span>
      ))}
    </div>
  )
}

// ─── Social links row ────────────────────────────────────────────────────────

// Strip any stored full URL down to just the handle
function extractInstagramHandle(raw: string | null): string {
  if (!raw) return ''
  return raw
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/$/, '')
    .trim()
}

function SocialRow({
  profile,
  theme,
  editing,
  onFieldChange,
  centered = false,
}: {
  profile: ProfileData
  theme: ThemeClasses
  editing?: boolean
  onFieldChange?: (field: string, value: string) => void
  centered?: boolean
}) {
  const handle = extractInstagramHandle(profile.instagram_url)
  const hasLinks = handle || profile.website_url

  if (editing) {
    return (
      <div className={`flex flex-wrap items-center gap-4 mt-2 ${centered ? 'justify-center' : ''}`}>
        {/* Instagram — handle only */}
        <span className={`${theme.textSecondary} text-xs flex items-center gap-1.5`}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
          <span className="opacity-40 select-none">@</span>
          <input
            type="text"
            defaultValue={handle}
            onChange={(e) => {
              const raw = e.currentTarget.value
              const clean = raw.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '').trim()
              onFieldChange?.('instagram_url', clean)
            }}
            placeholder="your_handle"
            className="bg-transparent border-b border-dashed border-current/50 focus:outline-none focus:border-current text-xs w-32 placeholder-current/30"
          />
        </span>
        {/* Website — full URL */}
        <span className={`${theme.textSecondary} text-xs flex items-center gap-1.5`}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <input
            type="text"
            defaultValue={profile.website_url ?? ''}
            onChange={(e) => onFieldChange?.('website_url', e.currentTarget.value.trim())}
            placeholder="https://yoursite.com"
            className="bg-transparent border-b border-dashed border-current/50 focus:outline-none focus:border-current text-xs w-40 placeholder-current/30"
          />
        </span>
      </div>
    )
  }

  if (!hasLinks) return null

  return (
    <div className={`flex flex-wrap items-center gap-3 mt-2 ${centered ? 'justify-center' : ''}`}>
      {handle && (
        <a
          href={`https://instagram.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${theme.textSecondary} hover:${theme.textPrimary} text-xs flex items-center gap-1.5 transition-colors`}
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
          @{handle}
        </a>
      )}
      {profile.website_url && safeExternalUrl(profile.website_url) && (
        <a
          href={safeExternalUrl(profile.website_url)!}
          target="_blank"
          rel="noopener noreferrer"
          className={`${theme.textSecondary} hover:${theme.textPrimary} text-xs flex items-center gap-1.5 transition-colors`}
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {profile.website_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
        </a>
      )}
    </div>
  )
}

// ─── Vine decoration ────────────────────────────────────────────────────────
// Sits at the bottom of the hero section when a banner is set.
// feTurbulence displacement makes bezier leaf paths look like real organic foliage.

function VineDecoration() {
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      width="100%"
      height="120"
      aria-hidden="true"
      className="absolute bottom-0 left-0 right-0 pointer-events-none"
      style={{ zIndex: 5 }}
    >
      <defs>
        {/* Leaf warp — fractal noise displaces leaf shapes so they look organic, not geometric */}
        <filter id="jg-leaf-warp" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.055 0.08" numOctaves="3" seed="23" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        {/* Stem warp — lower frequency for gentle woody wobble */}
        <filter id="jg-stem-warp" x="-5%" y="-30%" width="110%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.04" numOctaves="2" seed="7" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>

      {/* ── Main woody stem (double stroke for bark texture) ── */}
      <path
        d="M-10,92 C60,86 140,95 220,89 C300,83 380,93 460,88 C540,83 620,92 700,87 C780,82 860,92 940,87 C1020,82 1100,91 1180,87 C1260,83 1340,90 1420,87 L1460,88"
        stroke="#3d1106" strokeWidth="6.5" fill="none" strokeLinecap="round"
        filter="url(#jg-stem-warp)"
      />
      <path
        d="M-10,90 C60,84 140,93 220,87 C300,81 380,91 460,86 C540,81 620,90 700,85 C780,80 860,90 940,85 C1020,80 1100,89 1180,85 C1260,81 1340,88 1420,85"
        stroke="#7a3a18" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6"
        filter="url(#jg-stem-warp)"
      />

      {/* ── Branch stems ── */}
      <path d="M72,88 C68,76 62,62 65,46 C67,32 60,20 55,8"             stroke="#4a1c08" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#jg-stem-warp)"/>
      <path d="M248,86 C252,72 258,54 255,36 C253,22 260,10 264,3"      stroke="#4a1c08" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#jg-stem-warp)"/>
      <path d="M432,86 C425,70 420,52 422,32 C424,16 415,6 410,0"       stroke="#4a1c08" strokeWidth="3"   fill="none" strokeLinecap="round" filter="url(#jg-stem-warp)"/>
      <path d="M608,84 C612,65 618,44 622,22 C625,8 632,0 636,-4"       stroke="#4a1c08" strokeWidth="3"   fill="none" strokeLinecap="round" filter="url(#jg-stem-warp)"/>
      <path d="M832,84 C826,65 820,46 822,24 C824,10 814,2 810,-2"      stroke="#4a1c08" strokeWidth="3"   fill="none" strokeLinecap="round" filter="url(#jg-stem-warp)"/>
      <path d="M1008,86 C1016,70 1020,52 1016,32 C1013,16 1020,6 1024,0" stroke="#4a1c08" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#jg-stem-warp)"/>
      <path d="M1192,87 C1186,72 1183,55 1186,36 C1188,20 1180,8 1176,2" stroke="#4a1c08" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#jg-stem-warp)"/>
      <path d="M1368,89 C1364,76 1360,62 1364,46 C1366,32 1358,20 1353,10" stroke="#4a1c08" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#jg-stem-warp)"/>

      {/* ── Compound leaf clusters — bezier leaf paths + organic displacement filter ── */}
      {/* Each leaflet: bezier oval with pointed tip, base at origin */}

      {/* Cluster 1 */}
      <g transform="translate(55,8)" filter="url(#jg-leaf-warp)">
        <path d="M0,0 L0,-20" stroke="#3a1408" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M0,0 C-3,-1 -5,-5 -5,-9 C-5,-13 -2.5,-15 0,-15 C2.5,-15 5,-13 5,-9 C5,-5 3,-1 0,0 Z" transform="translate(-9,-8) rotate(-50)"  fill="#2d6a4f" opacity="0.92"/>
        <path d="M0,0 C-2,-1 -4,-4 -3.5,-9 C-3,-13 -1.5,-16 0,-16 C1.5,-16 3,-13 3.5,-9 C4,-4 2,-1 0,0 Z" transform="translate(-10,-15) rotate(-30)" fill="#1a4a2a" opacity="0.87"/>
        <path d="M0,0 C-3,-1 -5,-5 -5,-9 C-5,-13 -2.5,-15 0,-15 C2.5,-15 5,-13 5,-9 C5,-5 3,-1 0,0 Z" transform="translate(9,-8) rotate(50)"   fill="#3d9e6b" opacity="0.92"/>
        <path d="M0,0 C-2,-1 -4,-4 -3.5,-9 C-3,-13 -1.5,-16 0,-16 C1.5,-16 3,-13 3.5,-9 C4,-4 2,-1 0,0 Z" transform="translate(10,-15) rotate(28)"  fill="#2d6a4f" opacity="0.87"/>
        <path d="M0,0 C-3,-1 -5,-5 -4.5,-9 C-4,-14 -1.5,-17 0,-17 C1.5,-17 4,-14 4.5,-9 C5,-5 3,-1 0,0 Z" transform="translate(0,-19)"             fill="#236841" opacity="0.94"/>
      </g>

      {/* Cluster 2 */}
      <g transform="translate(264,3) rotate(8)" filter="url(#jg-leaf-warp)">
        <path d="M0,0 L0,-20" stroke="#3a1408" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M0,0 C-3,-1 -5,-5 -5,-9 C-5,-13 -2.5,-15 0,-15 C2.5,-15 5,-13 5,-9 C5,-5 3,-1 0,0 Z" transform="translate(-9,-7) rotate(-45)"  fill="#3d9e6b" opacity="0.90"/>
        <path d="M0,0 C-2,-1 -4,-4 -3.5,-9 C-3,-13 -1.5,-16 0,-16 C1.5,-16 3,-13 3.5,-9 C4,-4 2,-1 0,0 Z" transform="translate(-10,-14) rotate(-25)" fill="#2d6a4f" opacity="0.85"/>
        <path d="M0,0 C-3,-1 -5,-5 -5,-9 C-5,-13 -2.5,-15 0,-15 C2.5,-15 5,-13 5,-9 C5,-5 3,-1 0,0 Z" transform="translate(9,-7) rotate(45)"   fill="#236841" opacity="0.90"/>
        <path d="M0,0 C-2,-1 -4,-4 -3.5,-9 C-3,-13 -1.5,-16 0,-16 C1.5,-16 3,-13 3.5,-9 C4,-4 2,-1 0,0 Z" transform="translate(10,-14) rotate(25)"  fill="#3d9e6b" opacity="0.85"/>
        <path d="M0,0 C-3,-1 -5,-5 -4.5,-9 C-4,-14 -1.5,-17 0,-17 C1.5,-17 4,-14 4.5,-9 C5,-5 3,-1 0,0 Z" transform="translate(0,-19)"             fill="#1a4a2a" opacity="0.92"/>
      </g>

      {/* Cluster 3 */}
      <g transform="translate(410,0) rotate(-12)" filter="url(#jg-leaf-warp)">
        <path d="M0,0 L0,-22" stroke="#3a1408" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M0,0 C-4,-1 -6,-5 -5.5,-10 C-5,-14 -2.5,-16 0,-16 C2.5,-16 5,-14 5.5,-10 C6,-5 4,-1 0,0 Z" transform="translate(-10,-8) rotate(-48)" fill="#236841" opacity="0.90"/>
        <path d="M0,0 C-2,-1 -4,-4 -3.5,-9 C-3,-13 -1.5,-16 0,-16 C1.5,-16 3,-13 3.5,-9 C4,-4 2,-1 0,0 Z" transform="translate(-11,-16) rotate(-28)" fill="#3d9e6b" opacity="0.85"/>
        <path d="M0,0 C-4,-1 -6,-5 -5.5,-10 C-5,-14 -2.5,-16 0,-16 C2.5,-16 5,-14 5.5,-10 C6,-5 4,-1 0,0 Z" transform="translate(10,-8) rotate(48)"  fill="#2d6a4f" opacity="0.90"/>
        <path d="M0,0 C-2,-1 -4,-4 -3.5,-9 C-3,-13 -1.5,-16 0,-16 C1.5,-16 3,-13 3.5,-9 C4,-4 2,-1 0,0 Z" transform="translate(11,-16) rotate(28)"  fill="#1a4a2a" opacity="0.85"/>
        <path d="M0,0 C-3,-1 -5,-5 -5,-10 C-5,-15 -2,-18 0,-18 C2,-18 5,-15 5,-10 C5,-5 3,-1 0,0 Z"       transform="translate(0,-21)"               fill="#236841" opacity="0.94"/>
      </g>

      {/* Cluster 4 — tallest */}
      <g transform="translate(636,0) rotate(5)" filter="url(#jg-leaf-warp)">
        <path d="M0,0 L0,-26" stroke="#3a1408" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M0,0 C-5,-2 -8,-7 -7,-13 C-6,-18 -3,-20 0,-20 C3,-20 6,-18 7,-13 C8,-7 5,-2 0,0 Z"   transform="translate(-11,-9) rotate(-48)" fill="#2d6a4f" opacity="0.92"/>
        <path d="M0,0 C-3,-2 -5,-6 -4.5,-11 C-4,-16 -1.5,-18 0,-18 C1.5,-18 4,-16 4.5,-11 C5,-6 3,-2 0,0 Z" transform="translate(-13,-18) rotate(-28)" fill="#1a4a2a" opacity="0.88"/>
        <path d="M0,0 C-5,-2 -8,-7 -7,-13 C-6,-18 -3,-20 0,-20 C3,-20 6,-18 7,-13 C8,-7 5,-2 0,0 Z"   transform="translate(11,-9) rotate(48)"  fill="#3d9e6b" opacity="0.92"/>
        <path d="M0,0 C-3,-2 -5,-6 -4.5,-11 C-4,-16 -1.5,-18 0,-18 C1.5,-18 4,-16 4.5,-11 C5,-6 3,-2 0,0 Z" transform="translate(13,-18) rotate(28)"  fill="#2d6a4f" opacity="0.88"/>
        <path d="M0,0 C-4,-2 -6,-7 -6,-12 C-6,-18 -2,-21 0,-21 C2,-21 6,-18 6,-12 C6,-7 4,-2 0,0 Z"   transform="translate(0,-25)"               fill="#236841" opacity="0.96"/>
      </g>

      {/* Cluster 5 — tallest */}
      <g transform="translate(810,0) rotate(-5)" filter="url(#jg-leaf-warp)">
        <path d="M0,0 L0,-26" stroke="#3a1408" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M0,0 C-5,-2 -8,-7 -7,-13 C-6,-18 -3,-20 0,-20 C3,-20 6,-18 7,-13 C8,-7 5,-2 0,0 Z"   transform="translate(-11,-9) rotate(-48)" fill="#3d9e6b" opacity="0.92"/>
        <path d="M0,0 C-3,-2 -5,-6 -4.5,-11 C-4,-16 -1.5,-18 0,-18 C1.5,-18 4,-16 4.5,-11 C5,-6 3,-2 0,0 Z" transform="translate(-13,-18) rotate(-28)" fill="#2d6a4f" opacity="0.88"/>
        <path d="M0,0 C-5,-2 -8,-7 -7,-13 C-6,-18 -3,-20 0,-20 C3,-20 6,-18 7,-13 C8,-7 5,-2 0,0 Z"   transform="translate(11,-9) rotate(48)"  fill="#236841" opacity="0.92"/>
        <path d="M0,0 C-3,-2 -5,-6 -4.5,-11 C-4,-16 -1.5,-18 0,-18 C1.5,-18 4,-16 4.5,-11 C5,-6 3,-2 0,0 Z" transform="translate(13,-18) rotate(28)"  fill="#1a4a2a" opacity="0.88"/>
        <path d="M0,0 C-4,-2 -6,-7 -6,-12 C-6,-18 -2,-21 0,-21 C2,-21 6,-18 6,-12 C6,-7 4,-2 0,0 Z"   transform="translate(0,-25)"               fill="#3d9e6b" opacity="0.96"/>
      </g>

      {/* Cluster 6 */}
      <g transform="translate(1024,0) rotate(10)" filter="url(#jg-leaf-warp)">
        <path d="M0,0 L0,-22" stroke="#3a1408" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M0,0 C-4,-1 -6,-5 -5.5,-10 C-5,-14 -2.5,-16 0,-16 C2.5,-16 5,-14 5.5,-10 C6,-5 4,-1 0,0 Z" transform="translate(-10,-8) rotate(-48)" fill="#2d6a4f" opacity="0.90"/>
        <path d="M0,0 C-2,-1 -4,-4 -3.5,-9 C-3,-13 -1.5,-16 0,-16 C1.5,-16 3,-13 3.5,-9 C4,-4 2,-1 0,0 Z" transform="translate(-11,-15) rotate(-28)" fill="#236841" opacity="0.85"/>
        <path d="M0,0 C-4,-1 -6,-5 -5.5,-10 C-5,-14 -2.5,-16 0,-16 C2.5,-16 5,-14 5.5,-10 C6,-5 4,-1 0,0 Z" transform="translate(10,-8) rotate(48)"  fill="#1a4a2a" opacity="0.90"/>
        <path d="M0,0 C-2,-1 -4,-4 -3.5,-9 C-3,-13 -1.5,-16 0,-16 C1.5,-16 3,-13 3.5,-9 C4,-4 2,-1 0,0 Z" transform="translate(11,-15) rotate(28)"  fill="#3d9e6b" opacity="0.85"/>
        <path d="M0,0 C-3,-1 -5,-5 -5,-10 C-5,-15 -2,-18 0,-18 C2,-18 5,-15 5,-10 C5,-5 3,-1 0,0 Z"       transform="translate(0,-21)"               fill="#2d6a4f" opacity="0.94"/>
      </g>

      {/* Cluster 7 */}
      <g transform="translate(1176,2) rotate(-8)" filter="url(#jg-leaf-warp)">
        <path d="M0,0 L0,-20" stroke="#3a1408" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M0,0 C-3,-1 -5,-5 -5,-9 C-5,-13 -2.5,-15 0,-15 C2.5,-15 5,-13 5,-9 C5,-5 3,-1 0,0 Z" transform="translate(-9,-7) rotate(-45)"  fill="#236841" opacity="0.90"/>
        <path d="M0,0 C-2,-1 -4,-4 -3.5,-9 C-3,-13 -1.5,-16 0,-16 C1.5,-16 3,-13 3.5,-9 C4,-4 2,-1 0,0 Z" transform="translate(-10,-14) rotate(-25)" fill="#2d6a4f" opacity="0.85"/>
        <path d="M0,0 C-3,-1 -5,-5 -5,-9 C-5,-13 -2.5,-15 0,-15 C2.5,-15 5,-13 5,-9 C5,-5 3,-1 0,0 Z" transform="translate(9,-7) rotate(45)"   fill="#3d9e6b" opacity="0.90"/>
        <path d="M0,0 C-2,-1 -4,-4 -3.5,-9 C-3,-13 -1.5,-16 0,-16 C1.5,-16 3,-13 3.5,-9 C4,-4 2,-1 0,0 Z" transform="translate(10,-14) rotate(25)"  fill="#236841" opacity="0.85"/>
        <path d="M0,0 C-3,-1 -5,-5 -4.5,-9 C-4,-14 -1.5,-17 0,-17 C1.5,-17 4,-14 4.5,-9 C5,-5 3,-1 0,0 Z" transform="translate(0,-19)"             fill="#1a4a2a" opacity="0.92"/>
      </g>

      {/* Cluster 8 */}
      <g transform="translate(1353,10)" filter="url(#jg-leaf-warp)">
        <path d="M0,0 L0,-22" stroke="#3a1408" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M0,0 C-4,-1 -6,-5 -5.5,-10 C-5,-14 -2.5,-16 0,-16 C2.5,-16 5,-14 5.5,-10 C6,-5 4,-1 0,0 Z" transform="translate(-10,-8) rotate(-48)" fill="#3d9e6b" opacity="0.90"/>
        <path d="M0,0 C-2,-1 -4,-4 -3.5,-9 C-3,-13 -1.5,-16 0,-16 C1.5,-16 3,-13 3.5,-9 C4,-4 2,-1 0,0 Z" transform="translate(-11,-15) rotate(-30)" fill="#1a4a2a" opacity="0.85"/>
        <path d="M0,0 C-4,-1 -6,-5 -5.5,-10 C-5,-14 -2.5,-16 0,-16 C2.5,-16 5,-14 5.5,-10 C6,-5 4,-1 0,0 Z" transform="translate(10,-8) rotate(48)"  fill="#2d6a4f" opacity="0.90"/>
        <path d="M0,0 C-2,-1 -4,-4 -3.5,-9 C-3,-13 -1.5,-16 0,-16 C1.5,-16 3,-13 3.5,-9 C4,-4 2,-1 0,0 Z" transform="translate(11,-15) rotate(30)"  fill="#236841" opacity="0.85"/>
        <path d="M0,0 C-3,-1 -5,-5 -5,-10 C-5,-15 -2,-18 0,-18 C2,-18 5,-15 5,-10 C5,-5 3,-1 0,0 Z"       transform="translate(0,-21)"               fill="#3d9e6b" opacity="0.94"/>
      </g>

      {/* ── Individual leaves along stem (also organically warped) ── */}
      <g filter="url(#jg-leaf-warp)">
        <path d="M0,0 C-5,-2 -8,-7 -7,-13 C-6,-18 -3,-20 0,-20 C3,-20 6,-18 7,-13 C8,-7 5,-2 0,0 Z"
              transform="translate(150,84) rotate(-32) scale(1.25)" fill="#2d6a4f" opacity="0.82"/>
        <path d="M0,0 C-5,-2 -7,-7 -6,-12 C-5,-17 -2.5,-19 0,-19 C2.5,-19 5,-17 6,-12 C7,-7 5,-2 0,0 Z"
              transform="translate(345,82) rotate(18) scale(1.15)"  fill="#1a4a2a" opacity="0.78"/>
        <path d="M0,0 C-6,-2 -9,-7 -8,-13 C-7,-18 -3.5,-21 0,-21 C3.5,-21 7,-18 8,-13 C9,-7 6,-2 0,0 Z"
              transform="translate(525,80) rotate(-22) scale(1.3)"  fill="#3d9e6b" opacity="0.78"/>
        <path d="M0,0 C-5,-2 -7,-7 -6,-12 C-5,-17 -2.5,-19 0,-19 C2.5,-19 5,-17 6,-12 C7,-7 5,-2 0,0 Z"
              transform="translate(722,81) rotate(-5) scale(1.4)"   fill="#236841" opacity="0.82"/>
        <path d="M0,0 C-5,-2 -8,-7 -7,-13 C-6,-18 -3,-20 0,-20 C3,-20 6,-18 7,-13 C8,-7 5,-2 0,0 Z"
              transform="translate(926,81) rotate(28) scale(1.2)"   fill="#2d6a4f" opacity="0.80"/>
        <path d="M0,0 C-6,-2 -9,-7 -8,-13 C-7,-18 -3.5,-21 0,-21 C3.5,-21 7,-18 8,-13 C9,-7 6,-2 0,0 Z"
              transform="translate(1105,83) rotate(-18) scale(1.25)" fill="#1a4a2a" opacity="0.76"/>
        <path d="M0,0 C-5,-2 -7,-7 -6,-12 C-5,-17 -2.5,-19 0,-19 C2.5,-19 5,-17 6,-12 C7,-7 5,-2 0,0 Z"
              transform="translate(1285,84) rotate(22) scale(1.15)" fill="#3d9e6b" opacity="0.80"/>
      </g>

      {/* ── Tendrils ── */}
      <path d="M340,80 C345,74 350,68 347,62 C344,56 350,52 354,56 C358,60 354,66 348,62"
            stroke="#7a3a18" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M720,78 C724,72 730,66 726,60 C722,54 728,50 732,54 C736,58 730,64 724,60"
            stroke="#7a3a18" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M1098,80 C1093,74 1088,68 1092,62 C1096,56 1090,52 1086,56 C1082,60 1088,66 1094,62"
            stroke="#7a3a18" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Inline editable text ───────────────────────────────────────────────────

function EditableText({
  tag: Tag,
  className,
  value,
  editing,
  onChange,
  placeholder,
  prefix,
  suffix,
}: {
  tag: 'h1' | 'p' | 'span'
  className: string
  value: string
  editing: boolean
  onChange?: (value: string) => void
  placeholder?: string
  prefix?: string
  suffix?: string
}) {
  if (!editing) {
    if (!value && !placeholder) return null
    return (
      <Tag className={className}>
        {prefix && <span dangerouslySetInnerHTML={{ __html: prefix }} />}
        {value}
        {suffix && <span dangerouslySetInnerHTML={{ __html: suffix }} />}
      </Tag>
    )
  }

  return (
    <Tag
      className={`${className} outline-none ring-2 ring-dashed ring-jungle-500/30 rounded px-1 -mx-1 min-w-[80px]`}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange?.(e.currentTarget.textContent ?? '')}
      data-placeholder={placeholder}
    >
      {value}
    </Tag>
  )
}
