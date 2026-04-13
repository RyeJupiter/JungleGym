import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPrice, formatDuration } from '@junglegym/shared'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { SearchBar } from '@/components/SearchBar'
import { buildVideoSearchFilter, sortByRelevance } from '@/lib/search'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Explore' }

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>
}) {
  const { q, tag } = await searchParams
  const supabase = await createServerSupabaseClient()

  // If searching, find creators matching by name first (needed for video filter)
  let matchingCreatorIds: string[] = []
  if (q) {
    const { data: matchingProfiles } = await supabase
      .from('profiles').select('user_id')
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
    matchingCreatorIds = (matchingProfiles ?? []).map((p) => p.user_id)
  }

  // Build queries — apply search filter across all sections
  let videoQuery = supabase
    .from('videos')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(6)

  let sessionQuery = supabase
    .from('live_sessions')
    .select('id, title, description, scheduled_at, duration_minutes, status, creator_id')
    .or(`status.eq.live,and(status.eq.scheduled,scheduled_at.gte.${new Date().toISOString()})`)
    .order('scheduled_at', { ascending: true })
    .limit(4)

  if (q) {
    videoQuery = videoQuery.or(buildVideoSearchFilter(q, matchingCreatorIds))
    const sessionCreatorFilter = matchingCreatorIds.length
      ? `,creator_id.in.(${matchingCreatorIds.join(',')})`
      : ''
    sessionQuery = sessionQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%${sessionCreatorFilter}`)
  }
  if (tag) {
    videoQuery = videoQuery.contains('tags', [tag])
  }

  const [{ data: rawVideos }, { data: creatorUsers }, { data: sessions }] = await Promise.all([
    videoQuery,
    supabase.from('users').select('id').eq('role', 'creator').limit(8),
    sessionQuery,
  ])

  // Two-step: video + session creator profiles
  const videoCreatorIds = [...new Set((rawVideos ?? []).map((v) => v.creator_id))]
  const sessionCreatorIds = [...new Set((sessions ?? []).map((s) => s.creator_id))]
  const allCreatorIds = [...new Set([...videoCreatorIds, ...sessionCreatorIds])]
  const { data: allProfiles } = allCreatorIds.length
    ? await supabase.from('profiles').select('user_id, display_name, username, photo_url, tags').in('user_id', allCreatorIds)
    : { data: [] }
  const profileByUserId = Object.fromEntries((allProfiles ?? []).map((p) => [p.user_id, p]))

  // Rank by relevance when searching (after profiles are available for creator name scoring)
  const videos = q
    ? sortByRelevance(q, rawVideos ?? [], (v) => profileByUserId[v.creator_id]?.display_name)
    : (rawVideos ?? [])

  // Tag filter for sessions — sessions don't have tags, so filter by creator tags
  const filteredSessions = tag
    ? (sessions ?? []).filter((s) => {
        const profile = profileByUserId[s.creator_id]
        return profile?.tags?.includes(tag) ?? false
      })
    : (sessions ?? [])

  // Two-step: guide profiles
  const guideIds = creatorUsers?.map((u) => u.id) ?? []
  let guidesQuery = guideIds.length
    ? supabase.from('profiles').select('*').in('user_id', guideIds).limit(8).order('created_at', { ascending: false })
    : null
  if (guidesQuery && q) {
    guidesQuery = guidesQuery.or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
  }
  if (guidesQuery && tag) {
    guidesQuery = guidesQuery.contains('tags', [tag])
  }
  const { data: guides } = guidesQuery ? await guidesQuery : { data: [] }

  return (
    <div className="min-h-screen bg-jungle-950">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white">Explore</h1>
          <p className="text-jungle-400 mt-2">
            Discover movement classes, guides, and live sessions.
          </p>
        </div>

        <SearchBar
          basePath="/explore"
          placeholder="Search classes, guides, sessions..."
          query={q}
          tag={tag}
          showTags
        />

        {/* ── Latest Videos ─────────────────────────────────── */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <Link href="/classes" className="group">
              <h2 className="text-2xl font-black text-white group-hover:text-jungle-300 transition-colors">
                Latest Videos <span className="text-jungle-400 group-hover:text-jungle-300">&rarr;</span>
              </h2>
            </Link>
          </div>

          {videos.length === 0 ? (
            <div className="text-center py-12 bg-jungle-800/40 rounded-2xl border border-jungle-700">
              <p className="text-4xl mb-3">🌿</p>
              <p className="font-medium text-jungle-300">No videos yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos.map((video) => {
                const creator = profileByUserId[video.creator_id] ?? null
                return (
                  <Link key={video.id} href={`/video/${video.id}`}>
                    <div className="bg-jungle-800/60 rounded-2xl overflow-hidden border border-jungle-700 hover:border-jungle-400 hover:shadow-lg transition-all group">
                      <div className="aspect-video bg-jungle-900 relative">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>
                        )}
                        {video.is_free && (
                          <span className="absolute top-2 left-2 bg-jungle-600 text-white text-xs font-bold px-2 py-1 rounded-full">Free</span>
                        )}
                        {video.duration_seconds && (
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{formatDuration(video.duration_seconds)}</span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-jungle-100 overflow-hidden flex items-center justify-center text-xs flex-shrink-0">
                            {creator?.photo_url ? <img src={creator.photo_url} alt="" className="w-full h-full object-cover" /> : '🌿'}
                          </div>
                          <p className="text-xs text-jungle-600 font-semibold truncate">{creator?.display_name ?? 'Guide'}</p>
                          {video.view_count > 0 && (
                            <span className="text-xs text-stone-400 ml-auto flex-shrink-0">{video.view_count} views</span>
                          )}
                        </div>
                        <h3 className="font-bold text-white text-sm leading-snug mb-2 group-hover:text-jungle-300 transition-colors">{video.title}</h3>
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
        </section>

        {/* ── Guides ───────────────────────────────────────── */}
        {(guides ?? []).length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <Link href="/guides" className="group">
                <h2 className="text-2xl font-black text-white group-hover:text-jungle-300 transition-colors">
                  Guides <span className="text-jungle-400 group-hover:text-jungle-300">&rarr;</span>
                </h2>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {guides!.map((guide) => (
                <Link key={guide.user_id} href={guide.username ? `/@${guide.username}` : '/guides'}>
                  <div className="bg-jungle-800/60 rounded-2xl p-5 text-center border border-jungle-700 hover:border-jungle-400 hover:shadow-lg transition-all">
                    <div className="w-14 h-14 rounded-full bg-jungle-700 mx-auto mb-3 overflow-hidden flex items-center justify-center text-2xl">
                      {guide.photo_url ? <img src={guide.photo_url} alt={guide.display_name} className="w-full h-full object-cover" /> : '🌿'}
                    </div>
                    <p className="font-bold text-white text-sm">{guide.display_name}</p>
                    <p className="text-jungle-400 text-xs mb-1">@{guide.username}</p>
                    {guide.tags?.slice(0, 2).map((t: string) => (
                      <span key={t} className="inline-block mr-1 text-xs bg-jungle-700/60 text-jungle-300 px-2 py-0.5 rounded-full capitalize">{t}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Live Sessions ────────────────────────────────── */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <Link href="/sessions" className="group">
              <h2 className="text-2xl font-black text-white group-hover:text-jungle-300 transition-colors">
                Live Sessions <span className="text-jungle-400 group-hover:text-jungle-300">&rarr;</span>
              </h2>
            </Link>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 bg-jungle-800/40 rounded-2xl border border-jungle-700">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-medium text-jungle-300">No upcoming sessions.</p>
              <p className="text-sm mt-1 text-jungle-500">Check back soon for live classes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredSessions.map((s) => {
                const creator = profileByUserId[s.creator_id] ?? null
                const isLive = s.status === 'live'
                return (
                  <Link key={s.id} href={`/sessions/${s.id}`}>
                    <div className="bg-jungle-800/60 rounded-2xl border border-jungle-700 hover:border-jungle-400 hover:shadow-lg transition-all p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-white text-sm">{s.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${
                          isLive ? 'bg-red-900/60 text-red-300' : 'bg-jungle-700/60 text-jungle-300'
                        }`}>
                          {isLive ? 'Live' : 'Upcoming'}
                        </span>
                      </div>
                      {s.description && (
                        <p className="text-jungle-400 text-xs mb-3 line-clamp-2">{s.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-jungle-500">
                        {creator && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-jungle-700 overflow-hidden flex items-center justify-center text-[10px] flex-shrink-0">
                              {creator.photo_url ? <img src={creator.photo_url} alt="" className="w-full h-full object-cover" /> : '🌿'}
                            </div>
                            <span className="font-medium text-jungle-300">{creator.display_name}</span>
                          </div>
                        )}
                        <span>
                          {new Date(s.scheduled_at).toLocaleDateString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                          })}
                        </span>
                        <span>{s.duration_minutes} min</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
      <FooterCompact />
    </div>
  )
}

function PricePill({ label, price, dim }: { label: string; price: number; dim?: boolean }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      dim ? 'bg-jungle-800 text-jungle-500' : 'bg-jungle-700/60 text-jungle-300'
    }`}>
      {label} {formatPrice(price)}
    </span>
  )
}
