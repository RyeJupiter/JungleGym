// ─── Treehouse Layout Config Types ──────────────────────────────────────────

export type SectionType =
  | 'hero'
  | 'intro_video'
  | 'live_sessions'
  | 'free_videos'
  | 'paid_videos'
  | 'photo_gallery'
  | 'bio'

export type ThemeKey = 'jungle' | 'earth' | 'midnight' | 'dawn' | 'stone'

export type HeroVariant = 'default' | 'compact' | 'centered'

/**
 * Layout density for video/grid sections.
 * - showcase: 1–2 columns, big featured cards
 * - default:  1/2/3 columns (current behavior)
 * - compact:  2/3/4 columns, denser overview
 */
export type GridVariant = 'showcase' | 'default' | 'compact'

export interface SectionConfig {
  id: string
  type: SectionType
  visible: boolean
  variant?: string
  data?: Record<string, unknown>
}

export interface TreehouseConfig {
  version: 1
  theme: ThemeKey
  sections: SectionConfig[]
  banner?: string | null  // full URL of background image
}

// Sections backed by DB data — only one of each allowed
export const SINGLETON_SECTIONS: SectionType[] = [
  'hero',
  'live_sessions',
  'free_videos',
  'paid_videos',
  'bio',
]

// User-friendly labels for each section type
export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Profile',
  intro_video: 'Intro Video',
  live_sessions: 'Live Sessions',
  free_videos: 'Free Videos',
  paid_videos: 'Paid Videos',
  photo_gallery: 'Photo Gallery',
  bio: 'Movement Story',
}

// Default config — matches the current hardcoded treehouse layout exactly
export const DEFAULT_TREEHOUSE_CONFIG: TreehouseConfig = {
  version: 1,
  theme: 'jungle',
  sections: [
    { id: 'hero-1', type: 'hero', visible: true, variant: 'default' },
    { id: 'sessions-1', type: 'live_sessions', visible: true },
    { id: 'free-1', type: 'free_videos', visible: true },
    { id: 'paid-1', type: 'paid_videos', visible: true },
  ],
}

/** Parse a profile's treehouse_config JSONB, falling back to defaults */
export function resolveConfig(raw: unknown): TreehouseConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_TREEHOUSE_CONFIG
  const cfg = raw as Partial<TreehouseConfig>
  if (cfg.version !== 1 || !Array.isArray(cfg.sections)) return DEFAULT_TREEHOUSE_CONFIG
  return {
    version: 1,
    theme: cfg.theme ?? 'jungle',
    sections: cfg.sections,
    banner: cfg.banner ?? null,
  }
}

/** Create a new section with a unique ID */
export function createSection(type: SectionType, variant?: string): SectionConfig {
  return {
    id: crypto.randomUUID(),
    type,
    visible: true,
    variant,
    data: type === 'photo_gallery' ? { images: [] }
        : type === 'bio' ? { title: 'My Movement Story', body: '' }
        : undefined,
  }
}
