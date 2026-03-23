import { createServiceSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Movement Guides' }

export default async function GuidesPage() {
  const supabase = createServiceSupabaseClient()

  const { data: creatorUsers } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'creator')

  const creatorIds = (creatorUsers ?? []).map((u) => u.id)

  const { data: guides } = creatorIds.length > 0
    ? await supabase
        .from('profiles')
        .select('username, display_name, photo_url, bio, tags')
        .in('user_id', creatorIds)
        .order('display_name', { ascending: true })
    : { data: [] }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-stone-900">Movement Guides</h1>
          <p className="text-stone-500 mt-2">
            Vetted teachers. Real movement. Browse their classes and join their sessions.
          </p>
        </div>

        {(guides ?? []).length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <div className="text-5xl mb-4">🌿</div>
            <p className="font-medium">No guides yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides!.map((g) => (
              <Link
                key={g.username}
                href={`/@${g.username}`}
                className="bg-white rounded-2xl border border-stone-200 p-6 hover:border-jungle-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-jungle-100 overflow-hidden flex items-center justify-center text-2xl flex-shrink-0">
                    {g.photo_url ? (
                      <img src={g.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : '🌿'}
                  </div>
                  <div>
                    <p className="font-black text-stone-900 group-hover:text-jungle-700 transition-colors">
                      {g.display_name}
                    </p>
                    <p className="text-xs text-stone-400">@{g.username}</p>
                  </div>
                </div>

                {g.bio && (
                  <p className="text-stone-600 text-sm leading-relaxed line-clamp-3 mb-4">{g.bio}</p>
                )}

                {g.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {g.tags.slice(0, 4).map((tag: string) => (
                      <span
                        key={tag}
                        className="bg-jungle-50 text-jungle-700 text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
