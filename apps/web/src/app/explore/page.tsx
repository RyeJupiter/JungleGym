import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPrice, formatDuration } from '@junglegym/shared'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Explore' }

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>
}) {
  const { tag, q } = await searchParams
  const supabase = await createServerSupabaseClient()

  // Auth state for nav
  const { data: { user } } = await supabase.auth.getUser()

  // Build video query — no join (videos.creator_id → users, not profiles)
  let videoQuery = supabase
    .from('videos')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(30)

  if (tag) {
    videoQuery = videoQuery.contains('tags', [tag])
  }
  if (q) {
    videoQuery = videoQuery.ilike('title', `%${q}%`)
  }

  const { data: videos } = await videoQuery

  // Look up profiles for videos (two-step — FK goes users→profiles, not videos→profiles)
  const videoCreatorIds = [...new Set((videos ?? []).map((v) => v.creator_id))]
  const { data: videoProfiles } = videoCreatorIds.length
    ? await supabase.from('profiles').select('user_id, display_name, username, photo_url').in('user_id', videoCreatorIds)
    : { data: [] }
  const profileByUserId = Object.fromEntries((videoProfiles ?? []).map((p) => [p.user_id, p]))

  const FEATURED_TAGS = [
    'yoga', 'strength', 'mobility', 'hiit', 'kettlebell',
    'breathwork', 'meditation', 'bodyweight', 'flexibility',
  ]

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-stone-900">Classes</h1>
          <p className="text-stone-500 mt-2">
            Movement classes from skilled guides. Pay once, own forever.
          </p>
        </div>

        {/* Search */}
        <form method="get" className="mb-8">
          <div className="flex gap-3 max-w-lg">
            <input
              name="q"
              defaultValue={q ?? ''}
              placeholder="Search videos..."
              className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400 placeholder:text-stone-400"
            />
            <button type="submit" className="bg-jungle-700 hover:bg-jungle-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Search
            </button>
          </div>
        </form>

        {/* Tag pills */}
        <div className="flex gap-2 flex-wrap mb-10">
          <Link
            href="/explore"
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              !tag ? 'bg-jungle-900 text-white' : 'bg-white text-jungle-800 border border-jungle-200 hover:bg-jungle-50'
            }`}
          >
            All
          </Link>
          {FEATURED_TAGS.map((t) => (
            <Link
              key={t}
              href={`/explore?tag=${t}`}
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

        {/* Videos section */}
        <h2 className="text-2xl font-black text-jungle-900 mb-6">
          {q ? `Results for "${q}"` : tag ? `#${tag}` : 'Latest videos'}
        </h2>

        {(videos ?? []).length === 0 ? (
          <div className="text-center py-16 mb-16 text-stone-400 bg-white rounded-2xl border border-stone-200">
            <div className="text-5xl mb-4">🌿</div>
            <p className="font-medium text-stone-600">No videos found.</p>
            {(tag || q) && (
              <Link href="/explore" className="mt-3 inline-block text-jungle-600 font-semibold hover:underline text-sm">
                Clear filters →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {videos!.map((video) => {
              const creator = profileByUserId[video.creator_id] ?? null
              return (
                <Link key={video.id} href={`/video/${video.id}`}>
                  <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-jungle-400 hover:shadow-md transition-all group">
                    <div className="aspect-video bg-stone-100 relative">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>
                      )}
                      {video.is_free && (
                        <span className="absolute top-2 left-2 bg-jungle-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Free
                        </span>
                      )}
                      {video.duration_seconds && (
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(video.duration_seconds)}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-jungle-600 font-semibold mb-1">{creator?.display_name ?? creator?.username ?? 'Guide'}</p>
                      <h3 className="font-bold text-stone-900 text-sm leading-snug mb-2 group-hover:text-jungle-700 transition-colors">
                        {video.title}
                      </h3>
                      {!video.is_free && video.price_supported && (
                        <div className="flex gap-2 flex-wrap">
                          <PricePill label="Supported" price={video.price_supported} />
                          {video.price_community && <PricePill label="Community" price={video.price_community} />}
                          {video.price_abundance && <PricePill label="Abundance" price={video.price_abundance} dim />}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

function PricePill({ label, price, dim }: { label: string; price: number; dim?: boolean }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      dim ? 'bg-stone-100 text-stone-400' : 'bg-jungle-50 text-jungle-700'
    }`}>
      {label} {formatPrice(price)}
    </span>
  )
}
