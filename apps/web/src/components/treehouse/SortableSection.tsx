'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SectionConfig, HeroVariant, GridVariant, SectionType } from './config'
import { SECTION_LABELS } from './config'

type Props = {
  section: SectionConfig
  onToggleVisibility: () => void
  onVariantChange?: (variant: string) => void
  onRemove?: () => void
  canRemove: boolean
  children: React.ReactNode
}

const HERO_VARIANTS: { value: HeroVariant; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'compact', label: 'Compact' },
  { value: 'centered', label: 'Centered' },
]

const GRID_VARIANTS: { value: GridVariant; label: string }[] = [
  { value: 'showcase', label: 'Showcase — 1 big' },
  { value: 'default', label: 'Grid — roomy' },
  { value: 'compact', label: 'Compact — dense' },
]

const GRID_SECTIONS: SectionType[] = ['free_videos', 'paid_videos']

export function SortableSection({
  section,
  onToggleVisibility,
  onVariantChange,
  onRemove,
  canRemove,
  children,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {/* Section controls bar */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-2 py-2 -mb-2">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-stone-500 hover:text-stone-300 p-1 rounded transition-colors"
            title="Drag to reorder"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>

          {/* Label */}
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            {SECTION_LABELS[section.type]}
          </span>

          {/* Visibility toggle */}
          <button
            onClick={onToggleVisibility}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              section.visible
                ? 'text-stone-400 hover:text-stone-200'
                : 'text-red-400 hover:text-red-300'
            }`}
            title={section.visible ? 'Hide section' : 'Show section'}
          >
            {section.visible ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>

          {/* Hero variant picker */}
          {section.type === 'hero' && onVariantChange && (
            <select
              value={section.variant ?? 'default'}
              onChange={(e) => onVariantChange(e.target.value)}
              aria-label="Hero layout style"
              title="Change the hero layout"
              className="text-xs bg-stone-800 border border-stone-600 text-stone-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jungle-500"
            >
              {HERO_VARIANTS.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          )}

          {/* Grid variant picker (free_videos, paid_videos) */}
          {GRID_SECTIONS.includes(section.type) && onVariantChange && (
            <select
              value={section.variant ?? 'default'}
              onChange={(e) => onVariantChange(e.target.value)}
              aria-label="Video grid density"
              title="Change how the class cards are laid out"
              className="text-xs bg-stone-800 border border-stone-600 text-stone-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jungle-500"
            >
              {GRID_VARIANTS.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          )}

          {/* Remove button (for multi-instance sections) */}
          {canRemove && (
            <button
              onClick={onRemove}
              className="ml-auto text-xs text-red-500 hover:text-red-400 font-medium px-2 py-1 rounded transition-colors"
              title="Remove section"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Section content */}
      {children}
    </div>
  )
}
