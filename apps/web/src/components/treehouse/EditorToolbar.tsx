'use client'

import { useEffect, useRef, useState } from 'react'
import type { ThemeKey, TreehouseConfig } from './config'
import { THEME_MAP, THEME_LABELS, THEME_SWATCHES } from './themes'
import { TEMPLATES } from './templates'
import { BannerPicker } from './BannerPicker'

type Props = {
  config: TreehouseConfig
  onThemeChange: (theme: ThemeKey) => void
  onTemplateApply: (config: TreehouseConfig) => void
  onBannerChange: (url: string | null) => void
  onBannerUpload: (file: File) => Promise<string>
  onSave: () => void
  onCancel: () => void
  saving: boolean
}

type OpenMenu = 'theme' | 'background' | 'template' | null

export function EditorToolbar({
  config,
  onThemeChange,
  onTemplateApply,
  onBannerChange,
  onBannerUpload,
  onSave,
  onCancel,
  saving,
}: Props) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [pendingTemplate, setPendingTemplate] = useState<(typeof TEMPLATES)[number] | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  function closeAll() {
    setOpenMenu(null)
    setPendingTemplate(null)
  }

  // Close dropdowns on outside click / Escape — makes the menus feel native
  // and means keyboard users aren't trapped.
  useEffect(() => {
    if (!openMenu) return
    function onMouseDown(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) closeAll()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeAll()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openMenu])

  const themeLabel = THEME_LABELS[config.theme]
  const hasBanner = !!config.banner

  return (
    <div
      ref={toolbarRef}
      className="sticky top-0 z-50 bg-stone-900/95 backdrop-blur-sm border-b border-stone-700 shadow-lg"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white text-sm font-bold truncate">Editing your treehouse</span>
          <span className="hidden sm:inline text-stone-400 text-xs">— changes preview live</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* ── Theme picker ─────────────────────────── */}
          <div className="relative">
            <MenuButton
              open={openMenu === 'theme'}
              onToggle={() => setOpenMenu(openMenu === 'theme' ? null : 'theme')}
              label={`Theme: ${themeLabel.emoji} ${themeLabel.name}`}
              ariaLabel={`Change color theme. Current theme: ${themeLabel.name}`}
            >
              <span className="flex gap-0.5" aria-hidden>
                {THEME_SWATCHES[config.theme].map((c, i) => (
                  <span
                    key={i}
                    className="w-3 h-3 rounded-full border border-stone-600"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              <span className="text-xs font-semibold">
                {themeLabel.emoji} {themeLabel.name}
              </span>
              <Chevron open={openMenu === 'theme'} />
            </MenuButton>

            {openMenu === 'theme' && (
              <div
                role="menu"
                aria-label="Color themes"
                className="absolute top-full mt-2 right-0 bg-stone-900 border border-stone-700 rounded-xl shadow-xl p-2 w-60 z-50"
              >
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">
                  Color theme
                </p>
                {(Object.keys(THEME_MAP) as ThemeKey[]).map((key) => {
                  const active = config.theme === key
                  return (
                    <button
                      key={key}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => { onThemeChange(key); closeAll() }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400 ${
                        active ? 'bg-stone-700 text-white' : 'text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <span className="flex gap-0.5" aria-hidden>
                        {THEME_SWATCHES[key].map((c, i) => (
                          <span
                            key={i}
                            className="w-3 h-3 rounded-full border border-stone-600"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </span>
                      <span className="text-sm font-medium flex-1">
                        {THEME_LABELS[key].emoji} {THEME_LABELS[key].name}
                      </span>
                      {active && <span className="text-jungle-400 text-xs font-bold">●</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Background / banner picker ───────────── */}
          <div className="relative">
            <MenuButton
              open={openMenu === 'background'}
              onToggle={() => setOpenMenu(openMenu === 'background' ? null : 'background')}
              label={hasBanner ? 'Background — custom' : 'Background — none'}
              ariaLabel="Change the page background photo"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs font-semibold">Background</span>
              {hasBanner && (
                <span
                  aria-hidden
                  className="w-2 h-2 rounded-full bg-jungle-400 ring-1 ring-jungle-200/50"
                  title="Background set"
                />
              )}
              <Chevron open={openMenu === 'background'} />
            </MenuButton>

            {openMenu === 'background' && (
              <BannerPicker
                currentBanner={config.banner}
                onSelect={(url) => { onBannerChange(url); closeAll() }}
                onUpload={onBannerUpload}
              />
            )}
          </div>

          {/* ── Templates picker ─────────────────────── */}
          <div className="relative">
            <MenuButton
              open={openMenu === 'template'}
              onToggle={() => setOpenMenu(openMenu === 'template' ? null : 'template')}
              label="Apply a layout template"
              ariaLabel="Apply a layout template (replaces sections)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v3a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h3a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 14a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
                />
              </svg>
              <span className="text-xs font-semibold">Layouts</span>
              <Chevron open={openMenu === 'template'} />
            </MenuButton>

            {openMenu === 'template' && (
              <div
                role="menu"
                aria-label="Layout templates"
                className="absolute top-full mt-2 right-0 bg-stone-900 border border-stone-700 rounded-xl shadow-xl p-2 w-72 z-50"
              >
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">
                  Layouts
                </p>
                {pendingTemplate ? (
                  <div className="px-3 py-3">
                    <p className="text-sm font-semibold text-white mb-0.5">
                      Apply &ldquo;{pendingTemplate.name}&rdquo;?
                    </p>
                    <p className="text-xs text-stone-400 mb-3">
                      This will replace your current layout. You can still hit Cancel afterward if you don&apos;t like it.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { onTemplateApply(pendingTemplate.config); closeAll() }}
                        className="flex-1 bg-jungle-600 hover:bg-jungle-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-300"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingTemplate(null)}
                        className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                ) : (
                  TEMPLATES.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      role="menuitem"
                      onClick={() => setPendingTemplate(t)}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400"
                    >
                      <span className="text-sm font-medium text-white">{t.emoji} {t.name}</span>
                      <span className="block text-xs text-stone-500 mt-0.5">{t.description}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-stone-700 hidden sm:block" />

          {/* ── Save / Cancel ───────────────────────── */}
          <button
            type="button"
            onClick={onCancel}
            className="text-stone-400 hover:text-stone-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="bg-jungle-600 hover:bg-jungle-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-300"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Small presentational helpers ──────────────────────────────────────────

function MenuButton({
  open,
  onToggle,
  children,
  label,
  ariaLabel,
}: {
  open: boolean
  onToggle: () => void
  children: React.ReactNode
  label: string
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={ariaLabel}
      title={label}
      className={`flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-2 rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400 ${
        open ? 'border-jungle-500 text-white' : 'border-stone-600'
      }`}
    >
      {children}
    </button>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
