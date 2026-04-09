import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDuration, formatPrice } from '@junglegym/shared'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Library' }

export default async function LibraryPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Step 1: fetch purchases with video data (direct FK works: purchases.video_id → videos.id)
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*, videos(id, title, thumbnail_url, duration_seconds, tags, creator_id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Step 2: look up creator profiles (two-step — no FK join from videos to profiles)
  const creatorIds = [...new Set((purchases ?? [])
    .map((p) => (p.videos as { creator_id: string } | null)?.creator_id)
    .filter(Boolean) as string[])]
  const { data: creatorProfiles } = creatorIds.length
    ? await supabase.from('profiles').select('user_id, display_name, username').in('user_id', creatorIds)
    : { data: [] }
  const profileById = Object.fromEntries((creatorProfiles ?? []).map((p) => [p.user_id, p]))

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black text-stone-900 mb-10">My Library</h1>

        {(purchases ?? []).length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <div className="text-5xl mb-4">🌿</div>
            <p className="font-medium">You haven&apos;t unlocked any classes yet.</p>
            <Link href="/explore" className="mt-4 inline-block text-jungle-600 font-semibold hover:underline">
              Explore classes →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {purchases!.map((purchase) => {
              const video = purchase.videos as {
                id: string; title: string; thumbnail_url: string | null;
                duration_seconds: number | null; tags: string[]; creator_id: string
              } | null
              if (!video) return null
              const creator = profileById[video.creator_id] ?? null
              return (
                <Link key={purchase.id} href={`/video/${video.id}`}>
                  <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-jungle-300 transition-colors group shadow-sm">
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
                      <p className="text-xs text-jungle-700 font-semibold mb-1">
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
        )}
      </div>
    </div>
  )
}
