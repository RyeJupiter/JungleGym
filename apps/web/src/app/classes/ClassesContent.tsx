import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPrice, formatDuration } from '@junglegym/shared'
import { buildVideoSearchFilter, sortByRelevance } from '@/lib/search'

export async function ClassesContent({ q, tag, sort }: { q?: string; tag?: string; sort?: string }) {
  const supabase = await createServerSupabaseClient()

  // If searching, find creators matching by name first
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
    .is('deleted_at', null)
    .limit(30)

  if (tag) videoQuery = videoQuery.contains('tags', [tag])
  if (q) videoQuery = videoQuery.or(buildVideoSearchFilter(q, matchingCreatorIds))
  if (sort === 'popular') {
    videoQuery = videoQuery.order('view_count', { ascending: false })
  } else {
    videoQuery = videoQuery.order('created_at', { ascending: false })
  }

  const { data: rawVideos } = await videoQuery

  // Two-step join: look up profiles for video creators
  const videoCreatorIds = [...new Set((rawVideos ?? []).map((v) => v.creator_id))]
  const { data: videoProfiles } = videoCreatorIds.length
    ? await supabase.from('profiles').select('user_id, display_name, username, photo_url').in('user_id', videoCreatorIds)
    : { data: [] }
  const profileByUserId = Object.fromEntries((videoProfiles ?? []).map((p) => [p.user_id, p]))

  const videos = q
    ? sortByRelevance(q, rawVideos ?? [], (v) => profileByUserId[v.creator_id]?.display_name)
    : (rawVideos ?? [])

  if (videos.length === 0) {
    return (
      <div className="text-center py-16 bg-stone-100 rounded-2xl border border-stone-200">
        <div className="text-5xl mb-4">🌿</div>
        <p className="font-medium text-stone-600">No videos found.</p>
        {(tag || q) && (
          <Link href="/classes" className="mt-3 inline-block text-jungle-600 font-semibold hover:underline text-sm">
            Clear filters →
          </Link>
        )}
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
                  <p className="text-xs text-jungle-600 font-semibold truncate">{creator?.display_name ?? creator?.username ?? 'Guide'}</p>
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

function PricePill({ label, price, dim }: { label: string; price: number; dim?: boolean }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      dim ? 'bg-stone-100 text-stone-500' : 'bg-jungle-50 text-jungle-700'
    }`}>
      {label} {formatPrice(price)}
    </span>
  )
}
