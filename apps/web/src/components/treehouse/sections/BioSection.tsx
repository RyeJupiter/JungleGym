'use client'

import { useState } from 'react'
import type { ThemeClasses } from '../themes'

type Props = {
  title: string
  body: string
  theme: ThemeClasses
  editing?: boolean
  onChange?: (title: string, body: string) => void
}

export function BioSection({ title, body, theme, editing = false, onChange }: Props) {
  const [localTitle, setLocalTitle] = useState(title || 'My Movement Story')
  const [localBody, setLocalBody] = useState(body)

  function handleTitleChange(v: string) {
    setLocalTitle(v)
    onChange?.(v, localBody)
  }

  function handleBodyChange(v: string) {
    setLocalBody(v)
    onChange?.(localTitle, v)
  }

  const displayTitle = localTitle || 'My Movement Story'

  if (editing) {
    return (
      <div className="py-10">
        <input
          type="text"
          value={localTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="My Movement Story"
          className={`w-full bg-transparent border-b border-dashed ${theme.cardBorder} focus:outline-none text-2xl font-black ${theme.textPrimary} mb-4 pb-1 placeholder-current/30`}
        />
        <textarea
          value={localBody}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder="How did you come to movement? What do you believe it gives the world? Write as much or as little as you'd like — this is your story."
          rows={8}
          className={`w-full bg-transparent border ${theme.cardBorder} rounded-xl p-4 focus:outline-none ${theme.textSecondary} text-base leading-relaxed resize-none placeholder-current/30`}
        />
        <p className={`text-xs ${theme.textMuted} mt-2`}>{localBody.length} characters</p>
      </div>
    )
  }

  if (!localBody) return null

  return (
    <div className="py-10">
      <h2 className={`text-2xl font-black ${theme.textPrimary} mb-4`}>{displayTitle}</h2>
      <p className={`${theme.textSecondary} text-base leading-relaxed whitespace-pre-wrap max-w-2xl`}>
        {localBody}
      </p>
    </div>
  )
}
