'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SectionConfig, HeroVariant, GridVariant, SectionType } from './config'
import { SECTION_LABELS, SECTION_ICONS } from './config'

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
    opacity: isDragging ? 0.75 : undefined,
  }

  const isGrid = GRID_SECTIONS.includes(section.type)
  const showVariantPicker =
    !!onVariantChange && (section.type === 'hero' || isGrid)
  const variants = section.type === 'hero' ? HERO_VARIANTS : GRID_VARIANTS

  return (
    <div ref={setNodeRef} style={style} className="group/section">
      {/* Section controls bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div
          className={`flex items-center gap-1.5 py-2 px-2 -mx-2 rounded-xl transition-colors ${
            isDragging ? 'bg-stone-900/60' : 'group-hover/section:bg-stone-900/30'
          }`}
        >
          {/* Drag handle — 6-dot grip, larger hit target, soft hover */}
          <button
            {...attributes}
            {...listeners}
            aria-label={`Drag ${SECTION_LABELS[section.type]} to reorder`}
            title="Drag to reorder"
            className="cursor-grab active:cursor-grabbing text-stone-500 hover:text-stone-200 hover:bg-stone-800/60 p-1.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400"
          >
            <GripIcon />
          </button>

          {/* Section label pill */}
          <span className="flex items-center gap-1.5 bg-stone-800/60 border border-stone-700 px-2 py-1 rounded-md text-xs font-medium text-stone-300">
            <span aria-hidden className="text-sm leading-none">{SECTION_ICONS[section.type]}</span>
            <span>{SECTION_LABELS[section.type]}</span>
            {!section.visible && (
              <span className="ml-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400/80">
                · hidden
              </span>
            )}
          </span>

          {/* Visibility toggle */}
          <IconButton
            onClick={onToggleVisibility}
            title={section.visible ? 'Hide this section' : 'Show this section'}
            tone={section.visible ? 'default' : 'danger'}
          >
            {section.visible ? <EyeIcon /> : <EyeOffIcon />}
          </IconButton>

          {/* Variant picker (hero + video grids) */}
          {showVariantPicker && (
            <div className="relative">
              <select
                value={section.variant ?? 'default'}
                onChange={(e) => onVariantChange!(e.target.value)}
                aria-label={
                  section.type === 'hero' ? 'Hero layout style' : 'Video grid density'
                }
                title={
                  section.type === 'hero'
                    ? 'Change the hero layout'
                    : 'Change how the class cards are laid out'
                }
                className="appearance-none bg-stone-800/80 border border-stone-700 hover:border-stone-600 text-stone-200 text-xs font-medium pl-2.5 pr-7 py-1.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400 cursor-pointer transition-colors"
              >
                {variants.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
              <svg
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-500 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}

          {/* Remove button (multi-instance sections only) */}
          {canRemove && (
            <IconButton
              onClick={onRemove!}
              title={`Remove ${SECTION_LABELS[section.type]} section`}
              tone="danger"
              className="ml-auto"
            >
              <TrashIcon />
            </IconButton>
          )}
        </div>
      </div>

      {/* Section content */}
      {children}
    </div>
  )
}

// ─── Small presentational helpers ──────────────────────────────────────────

function IconButton({
  children,
  onClick,
  title,
  tone = 'default',
  className = '',
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  tone?: 'default' | 'danger'
  className?: string
}) {
  const base =
    'p-1.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400'
  const tones = {
    default: 'text-stone-500 hover:bg-stone-800/60 hover:text-stone-200',
    danger: 'text-stone-500 hover:bg-red-500/10 hover:text-red-400',
  } as const
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      title={title}
      className={`${base} ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  )
}

function GripIcon() {
  return (
    <svg className="w-3.5 h-5" viewBox="0 0 14 20" fill="currentColor" aria-hidden>
      <circle cx="3" cy="3" r="1.35" />
      <circle cx="11" cy="3" r="1.35" />
      <circle cx="3" cy="10" r="1.35" />
      <circle cx="11" cy="10" r="1.35" />
      <circle cx="3" cy="17" r="1.35" />
      <circle cx="11" cy="17" r="1.35" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}
