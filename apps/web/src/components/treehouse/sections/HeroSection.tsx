'use client'

import { useRef } from 'react'
import Link from 'next/link'
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
}

type HeroProps = {
  profile: ProfileData
  videoCount: number
  hasLiveSession: boolean
  hasPaidVideos: boolean
  isOwnProfile: boolean
  theme: ThemeClasses
  variant: HeroVariant
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
  editing = false,
  onFieldChange,
  onPhotoChange,
}: HeroProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    onPhotoChange?.(file, previewUrl)
    e.target.value = ''
  }

  const rates = {
    supported: Number(profile.supported_rate),
    community: Number(profile.community_rate),
    abundance: Number(profile.abundance_rate),
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${theme.heroBg} border-b ${theme.cardBorder}/50`}>
        <div className="relative max-w-5xl mx-auto px-6 py-8">
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

            {/* Stats + edit CTA */}
            <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
              <p className={`text-xl font-black ${theme.textPrimary}`}>{videoCount}</p>
              <p className={`${theme.accent} text-xs`}>{videoCount === 1 ? 'video' : 'videos'}</p>
              {isOwnProfile && !editing && (
                <Link
                  href={`/@${profile.username}?edit=true`}
                  className="bg-jungle-700 hover:bg-jungle-600 text-jungle-200 text-xs font-semibold px-4 py-2 rounded-lg border border-jungle-600 transition-colors"
                >
                  Edit treehouse
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'centered') {
    return (
      <div className={`relative ${theme.heroBg} border-b ${theme.cardBorder}/50`}>
        <HeroOverlay theme={theme} />
        <div className="relative max-w-5xl mx-auto px-6 py-12 text-center">
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

          <MetaRow profile={profile} theme={theme} editing={editing} onFieldChange={onFieldChange} />

          <p className={`text-xl font-black ${theme.textPrimary} mt-4`}>
            {videoCount} <span className={`${theme.accent} text-sm font-medium`}>{videoCount === 1 ? 'video' : 'videos'}</span>
          </p>

          {(hasPaidVideos || editing) && <RatesBar rates={rates} theme={theme} className="justify-center mt-6" editing={editing} onFieldChange={onFieldChange} />}

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
    )
  }

  // ── Default variant (current layout) ──
  return (
    <div className={`relative ${theme.heroBg} border-b ${theme.cardBorder}/50`}>
      <HeroOverlay theme={theme} />
      <div className="relative max-w-5xl mx-auto px-6 py-12">
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
          </div>

          {/* Stats + edit CTA */}
          <div className="flex-shrink-0 flex flex-col items-end gap-3">
            <div className="text-right">
              <p className={`text-2xl font-black ${theme.textPrimary}`}>{videoCount}</p>
              <p className={`${theme.accent} text-xs`}>{videoCount === 1 ? 'video' : 'videos'}</p>
            </div>
            {isOwnProfile && !editing && (
              <Link
                href={`/@${profile.username}?edit=true`}
                className="bg-jungle-700 hover:bg-jungle-600 text-jungle-200 text-xs font-semibold px-4 py-2 rounded-lg border border-jungle-600 transition-colors"
              >
                Edit treehouse
              </Link>
            )}
          </div>
        </div>

        {(hasPaidVideos || editing) && <RatesBar rates={rates} theme={theme} className="mt-8" editing={editing} onFieldChange={onFieldChange} />}
      </div>
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
}: {
  profile: ProfileData
  theme: ThemeClasses
  editing?: boolean
  onFieldChange?: (field: string, value: string) => void
}) {
  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-3 mt-1">
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
    <div className="flex flex-wrap items-center gap-2">
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
