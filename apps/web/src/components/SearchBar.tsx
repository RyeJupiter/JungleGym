import Link from 'next/link'

const DEFAULT_TAGS = [
  'yoga', 'strength', 'mobility', 'hiit', 'kettlebell',
  'breathwork', 'meditation', 'bodyweight', 'flexibility', 'dance',
]

interface SearchBarProps {
  /** Base path for the page (e.g., '/classes', '/sessions') */
  basePath: string
  /** Placeholder text for the search input */
  placeholder?: string
  /** Current search query from URL params */
  query?: string
  /** Current active tag from URL params */
  tag?: string
  /** Whether to show tag filter pills */
  showTags?: boolean
  /** Custom tag list (defaults to movement tags) */
  tags?: string[]
  /** Extra URL params to preserve across search/tag interactions (e.g., { sort: 'popular' }) */
  preserveParams?: Record<string, string>
}

export function SearchBar({
  basePath,
  placeholder = 'Search...',
  query,
  tag,
  showTags = false,
  tags = DEFAULT_TAGS,
  preserveParams = {},
}: SearchBarProps) {
  function buildUrl(overrides: { tag?: string | null; q?: string | null } = {}) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(preserveParams)) {
      params.set(k, v)
    }
    const newTag = overrides.tag !== undefined ? overrides.tag : tag
    const newQ = overrides.q !== undefined ? overrides.q : query
    if (newTag) params.set('tag', newTag)
    if (newQ) params.set('q', newQ)
    const qs = params.toString()
    return `${basePath}${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      <form method="get" action={basePath} className={showTags ? 'mb-6' : 'mb-10'}>
        {tag && <input type="hidden" name="tag" value={tag} />}
        {Object.entries(preserveParams).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <div className="flex gap-3 max-w-lg">
          <input
            name="q"
            defaultValue={query ?? ''}
            placeholder={placeholder}
            className="flex-1 rounded-xl border border-jungle-700 bg-jungle-800/60 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400 placeholder:text-jungle-500"
          />
          <button
            type="submit"
            className="bg-jungle-700 hover:bg-jungle-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Search
          </button>
        </div>
        {query && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-jungle-400">
              Showing results for &ldquo;{query}&rdquo;
            </span>
            <Link
              href={buildUrl({ q: null })}
              className="text-sm text-jungle-600 font-semibold hover:underline"
            >
              Clear
            </Link>
          </div>
        )}
      </form>

      {showTags && (
        <div className="flex gap-2 flex-wrap mb-10">
          <Link
            href={buildUrl({ tag: null })}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              !tag
                ? 'bg-jungle-500 text-white'
                : 'bg-jungle-800/60 text-jungle-300 border border-jungle-700 hover:bg-jungle-700'
            }`}
          >
            All
          </Link>
          {tags.map((t) => (
            <Link
              key={t}
              href={buildUrl({ tag: t })}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${
                tag === t
                  ? 'bg-jungle-500 text-white'
                  : 'bg-jungle-800/60 text-jungle-300 border border-jungle-700 hover:bg-jungle-700'
              }`}
            >
              {t}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
