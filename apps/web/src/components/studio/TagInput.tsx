'use client'

import { useState, useRef, KeyboardEvent } from 'react'

type Props = {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
}

export function TagInput({ tags, onChange, suggestions = [], placeholder = 'Add a tag…' }: Props) {
  const [input, setInput] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    // Treat hyphens and underscores as word separators, then re-join with hyphens
    const tag = raw.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
    if (!tag || tags.includes(tag)) return
    onChange([...tags, tag])
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      if (input.trim()) {
        addTag(input)
        setInput('')
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (val.endsWith(',')) {
      const tag = val.slice(0, -1)
      if (tag.trim()) { addTag(tag); setInput('') }
    } else {
      setInput(val)
    }
  }

  const visibleSuggestions = suggestions.filter((s) => !tags.includes(s))

  return (
    <div>
      <div
        ref={containerRef}
        className="min-h-[42px] w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 flex flex-wrap gap-1.5 cursor-text focus-within:ring-2 focus-within:ring-jungle-400 focus-within:border-jungle-400 transition-shadow"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-jungle-100 text-jungle-800 text-xs font-semibold px-2.5 py-1 rounded-full select-none"
          >
            {tag.replace(/-/g, ' ')}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()} // don't blur the input
              onClick={() => removeTag(i)}
              className="text-jungle-500 hover:text-jungle-900 leading-none text-sm font-bold ml-0.5"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[100px] outline-none text-sm text-stone-900 bg-transparent placeholder-stone-400 py-0.5"
          placeholder={tags.length === 0 ? placeholder : ''}
        />
      </div>

      {visibleSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-stone-400 mr-0.5">Suggested:</span>
          {visibleSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { addTag(s); inputRef.current?.focus() }}
              className="text-xs px-2.5 py-0.5 rounded-full border border-jungle-200 text-jungle-700 hover:bg-jungle-50 hover:border-jungle-400 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      <p className="mt-1.5 text-xs text-stone-400">Type a tag, then press <kbd className="font-mono bg-stone-100 px-1 rounded">space</kbd> or <kbd className="font-mono bg-stone-100 px-1 rounded">,</kbd> to add it · backspace removes the last one · use spaces for multi-word tags (stored as hyphens)</p>
    </div>
  )
}
