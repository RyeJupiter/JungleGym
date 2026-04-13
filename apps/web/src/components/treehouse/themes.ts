// ─── Treehouse Theme System ─────────────────────────────────────────────────

import type { ThemeKey } from './config'

export interface ThemeClasses {
  // Page-level
  pageBg: string
  pageBgHex: string  // hex equivalent for gradient fades / inline styles
  // Hero
  heroBg: string
  heroOverlayDot: string // the blurred circle accents
  // Text
  textPrimary: string
  textSecondary: string
  textMuted: string
  accent: string
  // Cards & borders
  cardBg: string
  cardBorder: string
  cardHoverBorder: string
  // Badges / pills
  badgeBg: string
  badgeText: string
  // Section dividers
  divider: string
  // Inputs (for edit mode)
  inputBorder: string
  inputFocus: string
}

export const THEME_MAP: Record<ThemeKey, ThemeClasses> = {
  jungle: {
    pageBg: 'bg-jungle-900',
    pageBgHex: '#0a1c14',
    heroBg: 'bg-gradient-to-b from-jungle-800 to-jungle-900',
    heroOverlayDot: 'bg-jungle-400',
    textPrimary: 'text-white',
    textSecondary: 'text-jungle-300',
    textMuted: 'text-jungle-500',
    accent: 'text-jungle-400',
    cardBg: 'bg-jungle-800/60',
    cardBorder: 'border-jungle-700',
    cardHoverBorder: 'hover:border-jungle-500',
    badgeBg: 'bg-jungle-600',
    badgeText: 'text-jungle-100',
    divider: 'border-jungle-800',
    inputBorder: 'border-jungle-600',
    inputFocus: 'focus:ring-jungle-400',
  },
  earth: {
    pageBg: 'bg-stone-900',
    pageBgHex: '#1c1917',
    heroBg: 'bg-gradient-to-b from-stone-800 to-stone-900',
    heroOverlayDot: 'bg-earth-400',
    textPrimary: 'text-white',
    textSecondary: 'text-stone-300',
    textMuted: 'text-stone-500',
    accent: 'text-earth-400',
    cardBg: 'bg-stone-800/60',
    cardBorder: 'border-stone-700',
    cardHoverBorder: 'hover:border-earth-400',
    badgeBg: 'bg-earth-600',
    badgeText: 'text-earth-100',
    divider: 'border-stone-800',
    inputBorder: 'border-earth-500',
    inputFocus: 'focus:ring-earth-400',
  },
  midnight: {
    pageBg: 'bg-slate-950',
    pageBgHex: '#020617',
    heroBg: 'bg-gradient-to-b from-slate-900 to-slate-950',
    heroOverlayDot: 'bg-indigo-400',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-500',
    accent: 'text-indigo-400',
    cardBg: 'bg-slate-800/60',
    cardBorder: 'border-slate-700',
    cardHoverBorder: 'hover:border-indigo-400',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-indigo-100',
    divider: 'border-slate-800',
    inputBorder: 'border-indigo-500',
    inputFocus: 'focus:ring-indigo-400',
  },
  dawn: {
    pageBg: 'bg-stone-50',
    pageBgHex: '#fafaf9',
    heroBg: 'bg-gradient-to-b from-white to-stone-50',
    heroOverlayDot: 'bg-jungle-200',
    textPrimary: 'text-stone-900',
    textSecondary: 'text-stone-500',
    textMuted: 'text-stone-400',
    accent: 'text-jungle-600',
    cardBg: 'bg-white',
    cardBorder: 'border-stone-200',
    cardHoverBorder: 'hover:border-jungle-400',
    badgeBg: 'bg-jungle-50',
    badgeText: 'text-jungle-700',
    divider: 'border-stone-200',
    inputBorder: 'border-stone-300',
    inputFocus: 'focus:ring-jungle-400',
  },
  stone: {
    pageBg: 'bg-stone-100',
    pageBgHex: '#f5f5f4',
    heroBg: 'bg-gradient-to-b from-stone-50 to-stone-100',
    heroOverlayDot: 'bg-stone-300',
    textPrimary: 'text-stone-900',
    textSecondary: 'text-stone-500',
    textMuted: 'text-stone-400',
    accent: 'text-stone-600',
    cardBg: 'bg-white',
    cardBorder: 'border-stone-200',
    cardHoverBorder: 'hover:border-stone-400',
    badgeBg: 'bg-stone-200',
    badgeText: 'text-stone-700',
    divider: 'border-stone-200',
    inputBorder: 'border-stone-300',
    inputFocus: 'focus:ring-stone-400',
  },
}

export const THEME_LABELS: Record<ThemeKey, { name: string; emoji: string }> = {
  jungle: { name: 'Jungle', emoji: '🌿' },
  earth: { name: 'Earth', emoji: '🌍' },
  midnight: { name: 'Midnight', emoji: '🌙' },
  dawn: { name: 'Dawn', emoji: '🌅' },
  stone: { name: 'Stone', emoji: '🪨' },
}

/** When a banner image is set, the dark overlay means we need light text regardless of theme */
export function withBannerOverrides(theme: ThemeClasses): ThemeClasses {
  return {
    ...theme,
    textPrimary: 'text-white',
    textSecondary: 'text-white/70',
    textMuted: 'text-white/40',
    accent: 'text-white/90',
    cardBg: 'bg-white/10',
    cardBorder: 'border-white/20',
    cardHoverBorder: 'hover:border-white/40',
    badgeBg: 'bg-white/15',
    badgeText: 'text-white',
    divider: 'border-white/15',
  }
}

/** Preview swatch colors for the theme picker UI */
export const THEME_SWATCHES: Record<ThemeKey, string[]> = {
  jungle: ['#0a1c14', '#237a51', '#3d9e6b'],
  earth: ['#1c1917', '#c4892a', '#d4a84e'],
  midnight: ['#020617', '#818cf8', '#6366f1'],
  dawn: ['#fafaf9', '#1c5c3c', '#237a51'],
  stone: ['#f5f5f4', '#57534e', '#78716c'],
}
