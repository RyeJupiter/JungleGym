'use client'

function getStep(value: number): number {
  if (value < 0.50) return 0.05
  if (value < 1.00) return 0.10
  if (value < 3.00) return 0.25
  if (value < 10.00) return 0.50
  return 1.00
}

type Props = {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

export function PriceInput({ label, hint, value, onChange, disabled }: Props) {
  function increment() {
    const current = parseFloat(value) || 0
    const step = getStep(current)
    const currentCents = Math.round(current * 100)
    const stepCents = Math.round(step * 100)
    const remainder = currentCents % stepCents
    if (remainder > 0) {
      // Not aligned — snap up to nearest step boundary
      onChange(((currentCents - remainder + stepCents) / 100).toFixed(2))
    } else {
      onChange(((currentCents + stepCents) / 100).toFixed(2))
    }
  }
  function decrement() {
    const current = parseFloat(value) || 0
    const step = getStep(Math.max(0, current - 0.001))
    const currentCents = Math.round(current * 100)
    const stepCents = Math.round(step * 100)
    const remainder = currentCents % stepCents
    if (remainder > 0) {
      // Not aligned — snap down to nearest step boundary
      onChange((Math.max(0, (currentCents - remainder) / 100)).toFixed(2))
    } else {
      onChange((Math.max(0, (currentCents - stepCents) / 100)).toFixed(2))
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-1">
        {label}{hint && <span className="text-stone-400 font-normal ml-1">{hint}</span>}
      </label>
      <div className={`flex items-stretch rounded-lg border border-stone-200 bg-white overflow-hidden ${disabled ? 'opacity-50' : 'focus-within:ring-2 focus-within:ring-jungle-400'}`}>
        {/* Value field */}
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full pl-5 pr-2 py-2 text-sm text-stone-900 text-center bg-transparent focus:outline-none disabled:cursor-not-allowed"
            placeholder="0.00"
          />
        </div>
        {/* Stacked arrows */}
        <div className="flex flex-col border-l border-stone-200 divide-y divide-stone-200">
          <button
            type="button"
            onClick={increment}
            disabled={disabled}
            className="flex-1 px-2.5 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors disabled:cursor-not-allowed"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={decrement}
            disabled={disabled}
            className="flex-1 px-2.5 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors disabled:cursor-not-allowed"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
