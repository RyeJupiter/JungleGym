'use client'

import { useState } from 'react'
import type { SectionConfig, SectionType } from './config'
import { SECTION_LABELS, SINGLETON_SECTIONS, createSection } from './config'

type Props = {
  currentSections: SectionConfig[]
  onAdd: (section: SectionConfig) => void
}

type AddOption = {
  type: SectionType
  description: string
  emoji: string
}

const ADD_OPTIONS: AddOption[] = [
  { type: 'bio', description: 'Share how you came to movement and why it matters to you', emoji: '🌿' },
  { type: 'intro_video', description: 'Upload a video to introduce yourself', emoji: '🎥' },
  { type: 'photo_gallery', description: 'Showcase photos of your practice', emoji: '📸' },
  { type: 'live_sessions', description: 'Show upcoming sessions', emoji: '📅' },
  { type: 'free_videos', description: 'Display free video content', emoji: '🆓' },
  { type: 'paid_videos', description: 'Display paid video content', emoji: '💰' },
]

export function AddSectionMenu({ currentSections, onAdd }: Props) {
  const [open, setOpen] = useState(false)

  function isDisabled(type: SectionType): boolean {
    if (!SINGLETON_SECTIONS.includes(type)) return false
    return currentSections.some((s) => s.type === type)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-4">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full border-2 border-dashed border-stone-600 hover:border-stone-400 text-stone-400 hover:text-stone-200 rounded-xl py-4 text-sm font-semibold transition-colors"
        >
          + Add section
        </button>

        {open && (
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-stone-800 border border-stone-600 rounded-xl shadow-xl p-2 z-40">
            {ADD_OPTIONS.map((opt) => {
              const disabled = isDisabled(opt.type)
              return (
                <button
                  key={opt.type}
                  disabled={disabled}
                  onClick={() => {
                    onAdd(createSection(opt.type))
                    setOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    disabled
                      ? 'text-stone-600 cursor-not-allowed'
                      : 'text-stone-300 hover:bg-stone-700/50'
                  }`}
                >
                  <span className="text-sm font-medium">{opt.emoji} {SECTION_LABELS[opt.type]}</span>
                  <span className="block text-xs text-stone-500 mt-0.5">
                    {disabled ? 'Already added' : opt.description}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
