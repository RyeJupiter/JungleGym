import { createServiceSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { SearchBar } from '@/components/SearchBar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Movement Guides' }

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
    guidesQuery = guidesQuery.or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
  }

  const { data: guides } = guidesQuery ? await guidesQuery : { data: [] }

  return (
    <div className="min-h-screen bg-jungle-950">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white">Movement Guides</h1>
          <p className="text-jungle-400 mt-2">
            Vetted teachers. Real movement. Browse their classes and join their sessions.
          </p>
        </div>

        <SearchBar
          basePath="/guides"
          placeholder="Search guides..."
          query={q}
          tag={tag}
          showTags
        />

        {(guides ?? []).length === 0 ? (
          <div className="text-center py-20 text-jungle-500">
            <div className="text-5xl mb-4">🌿</div>
            <p className="font-medium text-jungle-300">
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
                className="bg-jungle-800/60 rounded-2xl border border-jungle-700 p-5 hover:border-jungle-400 hover:shadow-lg transition-all group flex flex-col items-center text-center gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-jungle-700 overflow-hidden flex items-center justify-center text-2xl flex-shrink-0">
                  {g.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : '🌿'}
                </div>
                <div>
                  <p className="font-black text-white group-hover:text-jungle-300 transition-colors leading-tight">
                    {g.display_name}
                  </p>
                  <p className="text-xs text-jungle-500 mt-0.5">@{g.username}</p>
                  {g.tags && g.tags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {g.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-xs bg-jungle-700/60 text-jungle-300 px-2 py-0.5 rounded-full capitalize">
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
      <FooterCompact />
    </div>
  )
}
