// ─── Stock Layout Templates ─────────────────────────────────────────────────

import type { TreehouseConfig } from './config'

export interface LayoutTemplate {
  name: string
  description: string
  emoji: string
  config: TreehouseConfig
}

export const TEMPLATES: LayoutTemplate[] = [
  {
    name: 'Classic',
    description: 'The original treehouse layout — hero, sessions, videos.',
    emoji: '🌳',
    config: {
      version: 1,
      theme: 'jungle',
      sections: [
        { id: 'hero-1', type: 'hero', visible: true, variant: 'default' },
        { id: 'sessions-1', type: 'live_sessions', visible: true },
        { id: 'free-1', type: 'free_videos', visible: true },
        { id: 'paid-1', type: 'paid_videos', visible: true },
      ],
    },
  },
  {
    name: 'Showcase',
    description: 'Lead with your intro video and photo gallery.',
    emoji: '🎬',
    config: {
      version: 1,
      theme: 'midnight',
      sections: [
        { id: 'hero-1', type: 'hero', visible: true, variant: 'centered' },
        { id: 'intro-1', type: 'intro_video', visible: true },
        { id: 'gallery-1', type: 'photo_gallery', visible: true, data: { images: [] } },
        { id: 'free-1', type: 'free_videos', visible: true },
        { id: 'paid-1', type: 'paid_videos', visible: true },
        { id: 'sessions-1', type: 'live_sessions', visible: true },
      ],
    },
  },
  {
    name: 'Minimal',
    description: 'Clean and simple — just the essentials.',
    emoji: '✨',
    config: {
      version: 1,
      theme: 'stone',
      sections: [
        { id: 'hero-1', type: 'hero', visible: true, variant: 'compact' },
        { id: 'free-1', type: 'free_videos', visible: true },
        { id: 'paid-1', type: 'paid_videos', visible: true },
      ],
    },
  },
  {
    name: 'Earthy',
    description: 'Warm tones with intro video and sessions up front.',
    emoji: '🍂',
    config: {
      version: 1,
      theme: 'earth',
      sections: [
        { id: 'hero-1', type: 'hero', visible: true, variant: 'default' },
        { id: 'intro-1', type: 'intro_video', visible: true },
        { id: 'sessions-1', type: 'live_sessions', visible: true },
        { id: 'free-1', type: 'free_videos', visible: true },
        { id: 'paid-1', type: 'paid_videos', visible: true },
      ],
    },
  },
]
