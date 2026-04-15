import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPrice, formatDuration } from '@junglegym/shared'
import { buildVideoSearchFilter, sortByRelevance } from '@/lib/search'

/* ─── Videos Section ────────────────────────────────────────── */

export async function ExploreVideos({ q, tag }: { q?: string; tag?: string }) {
  const supabase = await createServerSupabaseClient()

  let matchingCreatorIds: string[] = []
  if (q) {
    const { data: matchingProfiles } = await supabase
      .from('profiles').select('user_id')
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
    matchingCreatorIds = (matchingProfiles ?? []).map((p) => p.user_id)
  }

  let videoQuery = supabase
    .from('videos')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(6)

  if (q) videoQuery = videoQuery.or(buildVideoSearchFilter(q, matchingCreatorIds))
  if (tag) videoQuery = videoQuery.contains('tags', [tag])

  const { data: rawVideos } = await videoQuery

  const videoCreatorIds = [...new Set((rawVideos ?? []).map((v) => v.creator_id))]
  const { data: profiles } = videoCreatorIds.length
    ? await supabase.from('profiles').select('user_id, display_name, username, photo_url').in('user_id', videoCreatorIds)
    : { data: [] }
  const profileByUserId = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]))

  const videos = q
    ? sortByRelevance(q, rawVideos ?? [], (v) => profileByUserId[v.creator_id]?.display_name)
    : (rawVideos ?? [])

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 bg-stone-100 rounded-2xl border border-stone-200">
        <p className="text-4xl mb-3">🌿</p>
        <p className="font-medium text-stone-600">No videos yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {videos.map((video) => {
        const creator = profileByUserId[video.creator_id] ?? null
        return (
          <Link key={video.id} href={`/video/${video.id}`}>
            <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-jungle-400 hover:shadow-md transition-all group">
              <div className="aspect-video bg-stone-100 relative">
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
                  <div className="w-6 h-6 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center text-xs flex-shrink-0">
                    {creator?.photo_url ? <img src={creator.photo_url} alt="" className="w-full h-full object-cover" /> : '🌿'}
                  </div>
                  <p className="text-xs text-jungle-600 font-semibold truncate">{creator?.display_name ?? 'Guide'}</p>
                  {video.view_count > 0 && (
                    <span className="text-xs text-stone-400 ml-auto flex-shrink-0">{video.view_count} views</span>
                  )}
                </div>
                <h3 className="font-bold text-stone-900 text-sm leading-snug mb-2 group-hover:text-jungle-700 transition-colors">{video.title}</h3>
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
  )
}

/* ─── Guides Section ────────────────────────────────────────── */

export async function ExploreGuides({ q, tag }: { q?: string; tag?: string }) {
  const svc = createServiceSupabaseClient()

  // Service client bypasses RLS — users table is own-record-only
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: creatorUsers } = await (svc as any).from('users').select('id').eq('role', 'creator').limit(8)
  const guideIds: string[] = ((creatorUsers ?? []) as { id: string }[]).map((u) => u.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let guidesQuery = guideIds.length
    ? (svc as any).from('profiles').select('*').in('user_id', guideIds).limit(8).order('created_at', { ascending: false })
    : null
  if (guidesQuery && q) {
    guidesQuery = guidesQuery.or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
  }
  if (guidesQuery && tag) {
    guidesQuery = guidesQuery.contains('tags', [tag])
  }
  const { data: guides } = guidesQuery ? await guidesQuery : { data: [] }

  if (!guides || guides.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {guides.map((guide) => (
        <Link key={guide.user_id} href={guide.username ? `/@${guide.username}` : '/guides'}>
          <div className="bg-white rounded-2xl p-5 text-center border border-stone-200 hover:border-jungle-400 hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-full bg-stone-100 mx-auto mb-3 overflow-hidden flex items-center justify-center text-2xl">
              {guide.photo_url ? <img src={guide.photo_url} alt={guide.display_name} className="w-full h-full object-cover" /> : '🌿'}
            </div>
            <p className="font-bold text-stone-900 text-sm">{guide.display_name}</p>
            <p className="text-stone-400 text-xs mb-1">@{guide.username}</p>
            {guide.tags?.slice(0, 2).map((t: string) => (
              <span key={t} className="inline-block mr-1 text-xs bg-jungle-50 text-jungle-700 px-2 py-0.5 rounded-full capitalize">{t}</span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  )
}

/* ─── Sessions Section ──────────────────────────────────────── */

export async function ExploreSessions({ q, tag }: { q?: string; tag?: string }) {
  const supabase = await createServerSupabaseClient()

  let matchingCreatorIds: string[] = []
  if (q) {
    const { data: matchingProfiles } = await supabase
      .from('profiles').select('user_id')
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
    matchingCreatorIds = (matchingProfiles ?? []).map((p) => p.user_id)
  }

  let sessionQuery = supabase
    .from('live_sessions')
    .select('id, title, description, scheduled_at, duration_minutes, status, creator_id')
    .or(`status.eq.live,and(status.eq.scheduled,scheduled_at.gte.${new Date().toISOString()})`)
    .order('scheduled_at', { ascending: true })
    .limit(4)

  if (q) {
    const sessionCreatorFilter = matchingCreatorIds.length
      ? `,creator_id.in.(${matchingCreatorIds.join(',')})`
      : ''
    sessionQuery = sessionQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%${sessionCreatorFilter}`)
  }

  const { data: sessions } = await sessionQuery

  const sessionCreatorIds = [...new Set((sessions ?? []).map((s) => s.creator_id))]
  const { data: profiles } = sessionCreatorIds.length
    ? await supabase.from('profiles').select('user_id, display_name, username, photo_url, tags').in('user_id', sessionCreatorIds)
    : { data: [] }
  const profileByUserId = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]))

  const filteredSessions = tag
    ? (sessions ?? []).filter((s) => {
        const profile = profileByUserId[s.creator_id]
        return profile?.tags?.includes(tag) ?? false
      })
    : (sessions ?? [])

  if (filteredSessions.length === 0) {
    return (
      <div className="text-center py-12 bg-stone-100 rounded-2xl border border-stone-200">
        <p className="text-4xl mb-3">📅</p>
        <p className="font-medium text-stone-600">No upcoming sessions.</p>
        <p className="text-sm mt-1 text-stone-400">Check back soon for live classes.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {filteredSessions.map((s) => {
        const creator = profileByUserId[s.creator_id] ?? null
        const isLive = s.status === 'live'
        return (
          <Link key={s.id} href={`/sessions/${s.id}`}>
            <div className="bg-white rounded-2xl border border-stone-200 hover:border-jungle-400 hover:shadow-md transition-all p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-stone-900 text-sm">{s.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${
                  isLive ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-jungle-50 text-jungle-700'
                }`}>
                  {isLive ? 'Live' : 'Upcoming'}
                </span>
              </div>
              {s.description && (
                <p className="text-stone-500 text-xs mb-3 line-clamp-2">{s.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-stone-400">
                {creator && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center text-[10px] flex-shrink-0">
                      {creator.photo_url ? <img src={creator.photo_url} alt="" className="w-full h-full object-cover" /> : '🌿'}
                    </div>
                    <span className="font-medium text-stone-600">{creator.display_name}</span>
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
  )
}

/* ─── Shared ────────────────────────────────────────────────── */

function PricePill({ label, price, dim }: { label: string; price: number; dim?: boolean }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      dim ? 'bg-stone-100 text-stone-500' : 'bg-jungle-50 text-jungle-700'
    }`}>
      {label} {formatPrice(price)}
    </span>
  )
}
