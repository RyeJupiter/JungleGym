import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDuration, formatPrice } from '@junglegym/shared'
import { videoMatchesQuery, scoreVideoRelevance } from '@/lib/search'

export async function LibraryContent({ userId, query }: { userId: string; query?: string }) {
  const supabase = await createServerSupabaseClient()

  // Step 1: fetch purchases with video data (direct FK works: purchases.video_id → videos.id)
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*, videos(id, title, description, thumbnail_url, duration_seconds, tags, ghost_tags, creator_id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Step 2: look up creator profiles (two-step — no FK join from videos to profiles)
  const creatorIds = [...new Set((purchases ?? [])
    .map((p) => (p.videos as { creator_id: string } | null)?.creator_id)
    .filter(Boolean) as string[])]
  const { data: creatorProfiles } = creatorIds.length
    ? await supabase.from('profiles').select('user_id, display_name, username').in('user_id', creatorIds)
    : { data: [] }
  const profileById = Object.fromEntries((creatorProfiles ?? []).map((p) => [p.user_id, p]))

  // Filter by search query and rank by relevance
  type VideoData = { title: string; description?: string | null; tags?: string[] | null; ghost_tags?: string[] | null; creator_id: string }
  const filteredPurchases = query
    ? (purchases ?? [])
        .filter((p) => {
          const video = p.videos as VideoData | null
          const creatorName = video ? profileById[video.creator_id]?.display_name : undefined
          return video ? videoMatchesQuery(query, video, creatorName) : false
        })
        .sort((a, b) => {
          const va = a.videos as VideoData | null
          const vb = b.videos as VideoData | null
          const nameA = va ? profileById[va.creator_id]?.display_name : undefined
          const nameB = vb ? profileById[vb.creator_id]?.display_name : undefined
          return scoreVideoRelevance(query, vb ?? {}, nameB) - scoreVideoRelevance(query, va ?? {}, nameA)
        })
    : (purchases ?? [])

  if (filteredPurchases.length === 0) {
    return (
      <div className="text-center py-20 text-stone-400">
        <div className="text-5xl mb-4">🌿</div>
        <p className="font-medium text-stone-600">
          {query ? 'No classes match your search.' : 'You haven\'t unlocked any classes yet.'}
        </p>
        {query ? (
          <Link href="/library" className="mt-3 inline-block text-jungle-600 font-semibold hover:underline text-sm">
            Clear search →
          </Link>
        ) : (
          <Link href="/explore" className="mt-4 inline-block text-jungle-600 font-semibold hover:underline">
            Explore classes →
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {filteredPurchases.map((purchase) => {
        const video = purchase.videos as {
          id: string; title: string; description: string | null; thumbnail_url: string | null;
          duration_seconds: number | null; tags: string[]; ghost_tags: string[] | null; creator_id: string
        } | null
        if (!video) return null
        const creator = profileById[video.creator_id] ?? null
        return (
          <Link key={purchase.id} href={`/video/${video.id}`}>
            <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-jungle-400 transition-colors group">
              <div className="aspect-video bg-stone-100 relative">
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>
                )}
                {video.duration_seconds && (
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration_seconds)}
                  </span>
                )}
                <span className="absolute top-2 left-2 bg-jungle-600 text-white text-xs font-bold px-2 py-0.5 rounded-full capitalize">
                  {purchase.tier}
                </span>
              </div>
              <div className="p-4">
                <p className="text-xs text-jungle-600 font-semibold mb-1">
                  {creator ? `@${creator.username}` : 'Guide'}
                </p>
                <h3 className="font-bold text-stone-900 text-sm leading-snug group-hover:text-jungle-700 transition-colors">
                  {video.title}
                </h3>
                <p className="text-xs text-stone-400 mt-1">Unlocked · {formatPrice(purchase.amount_paid)}</p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
