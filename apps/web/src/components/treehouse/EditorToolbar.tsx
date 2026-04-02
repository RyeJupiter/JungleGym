'use client'

import { useState } from 'react'
import type { ThemeKey, TreehouseConfig } from './config'
import { THEME_MAP, THEME_LABELS, THEME_SWATCHES } from './themes'
import { TEMPLATES } from './templates'

type Props = {
  config: TreehouseConfig
  onThemeChange: (theme: ThemeKey) => void
  onTemplateApply: (config: TreehouseConfig) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}

export function EditorToolbar({
  config,
  onThemeChange,
  onTemplateApply,
  onSave,
  onCancel,
  saving,
}: Props) {
  const [showThemes, setShowThemes] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const theme = THEME_MAP[config.theme]

  return (
    <div className="sticky top-0 z-50 bg-stone-900/95 backdrop-blur-sm border-b border-stone-700 shadow-lg">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-bold">Editing treehouse</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme picker */}
          <div className="relative">
            <button
              onClick={() => { setShowThemes(!showThemes); setShowTemplates(false) }}
              className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-3 py-2 rounded-lg border border-stone-600 transition-colors"
            >
              <span className="flex gap-0.5">
                {THEME_SWATCHES[config.theme].map((c, i) => (
                  <span key={i} className="w-3 h-3 rounded-full border border-stone-600" style={{ backgroundColor: c }} />
                ))}
              </span>
              Theme
            </button>

            {showThemes && (
              <div className="absolute top-full mt-2 right-0 bg-stone-800 border border-stone-600 rounded-xl shadow-xl p-2 w-52 z-50">
                {(Object.keys(THEME_MAP) as ThemeKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => { onThemeChange(key); setShowThemes(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      config.theme === key ? 'bg-stone-700 text-white' : 'text-stone-300 hover:bg-stone-700/50'
                    }`}
                  >
                    <span className="flex gap-0.5">
                      {THEME_SWATCHES[key].map((c, i) => (
                        <span key={i} className="w-3 h-3 rounded-full border border-stone-600" style={{ backgroundColor: c }} />
                      ))}
                    </span>
                    <span className="text-sm font-medium">
                      {THEME_LABELS[key].emoji} {THEME_LABELS[key].name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Template picker */}
          <div className="relative">
            <button
              onClick={() => { setShowTemplates(!showTemplates); setShowThemes(false) }}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-3 py-2 rounded-lg border border-stone-600 transition-colors"
            >
              Templates
            </button>

            {showTemplates && (
              <div className="absolute top-full mt-2 right-0 bg-stone-800 border border-stone-600 rounded-xl shadow-xl p-2 w-64 z-50">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      if (confirm(`Apply the "${t.name}" template? This will replace your current layout.`)) {
                        onTemplateApply(t.config)
                        setShowTemplates(false)
                      }
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-stone-300 hover:bg-stone-700/50 transition-colors"
                  >
                    <span className="text-sm font-medium">{t.emoji} {t.name}</span>
                    <span className="block text-xs text-stone-500 mt-0.5">{t.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-stone-700" />

          {/* Save / Cancel */}
          <button
            onClick={onCancel}
            className="text-stone-400 hover:text-stone-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-jungle-600 hover:bg-jungle-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
