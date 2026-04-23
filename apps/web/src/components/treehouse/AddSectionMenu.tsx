'use client'

import { useEffect, useRef, useState } from 'react'
import type { SectionConfig, SectionType } from './config'
import type { ViewerRole } from './sections/SectionRenderer'
import { SECTION_LABELS, SECTION_ICONS, SINGLETON_SECTIONS, createSection } from './config'

type Props = {
  currentSections: SectionConfig[]
  viewerRole: ViewerRole
  onAdd: (section: SectionConfig) => void
}

type AddOption = {
  type: SectionType
  description: string
  /** If present, only viewers with this role can add the section. */
  creatorOnly?: boolean
}

// Hero is a singleton and always present — it's not in the add menu.
const ADD_OPTIONS: AddOption[] = [
  { type: 'bio',           description: 'Share how you came to movement and why it matters to you' },
  { type: 'intro_video',   description: 'Upload a short clip to introduce yourself', creatorOnly: true },
  { type: 'photo_gallery', description: 'Showcase photos of your practice' },
  { type: 'live_sessions', description: 'Show upcoming live sessions' },
  { type: 'free_videos',   description: 'A grid of your free classes' },
  { type: 'paid_videos',   description: 'A grid of your paid classes' },
]

export function AddSectionMenu({ currentSections, viewerRole, onAdd }: Props) {
  // Learners don't get video uploads — intro-video bandwidth is reserved for
  // creators whose profile is their storefront.
  const visibleOptions = ADD_OPTIONS.filter(
    (opt) => !opt.creatorOnly || viewerRole === 'creator',
  )
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close on outside click + Escape — matches the toolbar menu behavior so
  // the whole editor feels consistent.
  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function isDisabled(type: SectionType): boolean {
    if (!SINGLETON_SECTIONS.includes(type)) return false
    return currentSections.some((s) => s.type === type)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400 ${
            open
              ? 'border-jungle-500 text-jungle-300 bg-jungle-500/5'
              : 'border-stone-700 hover:border-stone-500 text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
          }`}
        >
          <PlusIcon />
          <span>Add a section</span>
        </button>

        {open && (
          <div
            role="menu"
            aria-label="Section types"
            className="absolute bottom-full mb-2 left-0 right-0 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl p-2 z-40"
          >
            <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">
              Add a section
            </p>
            {visibleOptions.map((opt) => {
              const disabled = isDisabled(opt.type)
              return (
                <button
                  key={opt.type}
                  type="button"
                  role="menuitem"
                  disabled={disabled}
                  onClick={() => {
                    onAdd(createSection(opt.type))
                    setOpen(false)
                  }}
                  className={`w-full flex items-start gap-3 text-left px-3 py-2.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400 ${
                    disabled
                      ? 'text-stone-600 cursor-not-allowed'
                      : 'text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  <span aria-hidden className="text-lg leading-none flex-shrink-0 mt-0.5">
                    {SECTION_ICONS[opt.type]}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium">
                      {SECTION_LABELS[opt.type]}
                    </span>
                    <span className="block text-xs text-stone-500 mt-0.5">
                      {disabled ? 'Already on your treehouse' : opt.description}
                    </span>
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

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  )
}
