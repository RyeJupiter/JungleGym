import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPrice, formatDuration } from '@junglegym/shared'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Explore' }

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; sort?: string }>
}) {
  const { tag, q, sort } = await searchParams
  const supabase = await createServerSupabaseClient()

  // Build video query — no FK join (unreliable), two-step instead
  let videoQuery = supabase
    .from('videos')
    .select('*')
    .eq('published', true)
    .limit(30)

  if (tag) {
    videoQuery = videoQuery.contains('tags', [tag])
  }
  if (q) {
    videoQuery = videoQuery.ilike('title', `%${q}%`)
  }
  if (sort === 'popular') {
    videoQuery = videoQuery.order('view_count', { ascending: false })
  } else {
    videoQuery = videoQuery.order('created_at', { ascending: false })
  }

  // Fetch videos + creator users in parallel
  const [{ data: videos }, { data: creatorUsers }] = await Promise.all([
    videoQuery,
    supabase.from('users').select('id').eq('role', 'creator').limit(8),
  ])

  // Two-step join: look up profiles for video creators
  const videoCreatorIds = [...new Set((videos ?? []).map((v) => v.creator_id))]
  const { data: videoProfiles } = videoCreatorIds.length
    ? await supabase.from('profiles').select('user_id, display_name, username, photo_url').in('user_id', videoCreatorIds)
    : { data: [] }
  const profileByUserId = Object.fromEntries((videoProfiles ?? []).map((p) => [p.user_id, p]))

  // Two-step: look up creator profiles for Teachers section
  const creatorIds = creatorUsers?.map((u) => u.id) ?? []
  const { data: creators } = creatorIds.length
    ? await supabase
        .from('profiles')
        .select('*')
        .in('user_id', creatorIds)
        .limit(8)
        .order('created_at', { ascending: false })
    : { data: [] }

  const FEATURED_TAGS = [
    'yoga', 'strength', 'mobility', 'hiit', 'kettlebell',
    'breathwork', 'meditation', 'bodyweight', 'flexibility',
  ]

  function sortUrl(s: string) {
    const params = new URLSearchParams()
    if (tag) params.set('tag', tag)
    if (q) params.set('q', q)
    if (s !== 'newest') params.set('sort', s)
    const qs = params.toString()
    return `/explore${qs ? `?${qs}` : ''}`
  }

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
          {tag && <input type="hidden" name="tag" value={tag} />}
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
        <div className="flex gap-2 flex-wrap mb-6">
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

        {/* Sort + heading */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-jungle-900">
            {q ? `Results for "${q}"` : tag ? `#${tag}` : 'Latest videos'}
          </h2>
          <div className="flex gap-1 text-sm">
            <Link
              href={sortUrl('newest')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                sort !== 'popular' ? 'bg-stone-200 text-stone-800' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Newest
            </Link>
            <Link
              href={sortUrl('popular')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                sort === 'popular' ? 'bg-stone-200 text-stone-800' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Popular
            </Link>
          </div>
        </div>

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
                          loading="lazy"
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
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-jungle-100 overflow-hidden flex items-center justify-center text-xs flex-shrink-0">
                          {creator?.photo_url ? (
                            <img src={creator.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : '🌿'}
                        </div>
                        <p className="text-xs text-jungle-600 font-semibold truncate">{creator?.display_name ?? creator?.username ?? 'Guide'}</p>
                        {video.view_count > 0 && (
                          <span className="text-xs text-stone-400 ml-auto flex-shrink-0">{video.view_count} views</span>
                        )}
                      </div>
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

        {/* Teachers section (from Rye) */}
        {(creators ?? []).length > 0 && (
          <>
            <h2 className="text-2xl font-black text-jungle-900 mb-6">Teachers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {creators!.map((creator) => (
                <Link key={creator.id} href={creator.username ? `/@${creator.username}` : '/explore'}>
                  <div className="bg-white rounded-2xl p-5 text-center border border-stone-200 hover:border-jungle-400 hover:shadow-md transition-all">
                    <div className="w-14 h-14 rounded-full bg-jungle-100 mx-auto mb-3 overflow-hidden flex items-center justify-center text-2xl">
                      {creator.photo_url ? (
                        <img src={creator.photo_url} alt={creator.display_name} className="w-full h-full object-cover" />
                      ) : '🌿'}
                    </div>
                    <p className="font-bold text-jungle-900 text-sm">{creator.display_name}</p>
                    <p className="text-jungle-500 text-xs mb-1">@{creator.username}</p>
                    {creator.tags?.slice(0, 2).map((t: string) => (
                      <span key={t} className="inline-block mr-1 text-xs bg-jungle-50 text-jungle-700 px-2 py-0.5 rounded-full capitalize">
                        {t}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </>
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
