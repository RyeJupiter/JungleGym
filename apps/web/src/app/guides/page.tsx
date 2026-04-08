import { createServiceSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Movement Guides' }

const FEATURED_TAGS = [
  'yoga', 'strength', 'mobility', 'hiit', 'kettlebell',
  'breathwork', 'meditation', 'bodyweight', 'flexibility', 'dance',
]

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>
}) {
  const { tag, q } = await searchParams
  const svc = createServiceSupabaseClient()

  // Get creator user IDs (two-step — users RLS is own-record-only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: creatorUsers } = await (svc as any)
    .from('users')
    .select('id')
    .eq('role', 'creator')

  const creatorIds: string[] = ((creatorUsers ?? []) as { id: string }[]).map((u) => u.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let guidesQuery = creatorIds.length > 0
    ? (svc as any)
        .from('profiles')
        .select('username, display_name, photo_url, tags')
        .in('user_id', creatorIds)
        .order('display_name', { ascending: true })
    : null

  if (guidesQuery && tag) {
    guidesQuery = guidesQuery.contains('tags', [tag])
  }
  if (guidesQuery && q) {
    guidesQuery = guidesQuery.ilike('display_name', `%${q}%`)
  }

  const { data: guides } = guidesQuery ? await guidesQuery : { data: [] }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-stone-900">Movement Guides</h1>
          <p className="text-stone-500 mt-2">
            Vetted teachers. Real movement. Browse their classes and join their sessions.
          </p>
        </div>

        {/* Search */}
        <form method="get" className="mb-6">
          <div className="flex gap-3 max-w-lg">
            <input
              name="q"
              defaultValue={q ?? ''}
              placeholder="Search guides..."
              className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400 placeholder:text-stone-400"
            />
            {tag && <input type="hidden" name="tag" value={tag} />}
            <button type="submit" className="bg-jungle-700 hover:bg-jungle-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Search
            </button>
          </div>
        </form>

        {/* Tag pills */}
        <div className="flex gap-2 flex-wrap mb-10">
          <Link
            href={q ? `/guides?q=${encodeURIComponent(q)}` : '/guides'}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              !tag ? 'bg-jungle-900 text-white' : 'bg-white text-jungle-800 border border-jungle-200 hover:bg-jungle-50'
            }`}
          >
            All
          </Link>
          {FEATURED_TAGS.map((t) => (
            <Link
              key={t}
              href={q ? `/guides?tag=${t}&q=${encodeURIComponent(q)}` : `/guides?tag=${t}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${
                tag === t
                  ? 'bg-jungle-700 text-white'
                  : 'bg-white text-jungle-800 border border-jungle-200 hover:bg-jungle-50'
              }`}
            >
              {t}
            </Link>
          ))}
        </div>

        {(guides ?? []).length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <div className="text-5xl mb-4">🌿</div>
            <p className="font-medium">
              {tag || q ? 'No guides match your search.' : 'No guides yet — check back soon.'}
            </p>
            {(tag || q) && (
              <Link href="/guides" className="mt-3 inline-block text-jungle-600 font-semibold hover:underline text-sm">
                Clear filters →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(guides ?? []).map((g: { username: string; display_name: string; photo_url: string | null; tags: string[] | null }) => (
              <Link
                key={g.username}
                href={`/@${g.username}`}
                className="bg-white rounded-2xl border border-stone-200 p-5 hover:border-jungle-400 hover:shadow-md transition-all group flex flex-col items-center text-center gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-jungle-100 overflow-hidden flex items-center justify-center text-2xl flex-shrink-0">
                  {g.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : '🌿'}
                </div>
                <div>
                  <p className="font-black text-stone-900 group-hover:text-jungle-700 transition-colors leading-tight">
                    {g.display_name}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">@{g.username}</p>
                  {g.tags && g.tags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {g.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-xs bg-jungle-50 text-jungle-700 px-2 py-0.5 rounded-full capitalize">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
