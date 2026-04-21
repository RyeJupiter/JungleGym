import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDuration } from '@junglegym/shared'
import { CheckoutFlow } from '@/components/video/CheckoutFlow'

export async function CheckoutContent({ videoId }: { videoId: string }) {
  const supabase = await createServerSupabaseClient()

  const { data: video } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .eq('published', true)
    .is('deleted_at', null)
    .single()

  if (!video) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=/video/${videoId}/checkout`)
  }

  // Already owns it (active access only — expired share doesn't count)
  const { data: purchase } = await supabase
    .from('purchases')
    .select('tier')
    .eq('user_id', user.id)
    .eq('video_id', video.id)
    .or('expires_at.is.null,expires_at.gt.now()')
    .maybeSingle()

  if (video.is_free || purchase) {
    redirect(`/video/${videoId}`)
  }

  const { data: profileRows } = await supabase
    .from('profiles')
    .select('display_name, username, photo_url')
    .eq('user_id', video.creator_id)
    .limit(1)
  const creator = profileRows?.[0] ?? null

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left: compact video card */}
        <div className="lg:col-span-2">
          <div className="sticky top-20">
            {/* Thumbnail */}
            <div className="rounded-xl overflow-hidden aspect-video bg-jungle-800 mb-4">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-jungle-600 text-3xl">
                  🎬
                </div>
              )}
            </div>

            {/* Video info */}
            <h1 className="text-lg font-bold text-white mb-1">{video.title}</h1>

            {creator && (
              <Link
                href={`/@${creator.username}`}
                className="flex items-center gap-2 mt-3 group"
              >
                <div className="w-7 h-7 rounded-full bg-jungle-700 overflow-hidden flex items-center justify-center text-sm flex-shrink-0">
                  {creator.photo_url ? (
                    <img src={creator.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : '🌿'}
                </div>
                <span className="text-sm text-jungle-400 group-hover:text-jungle-300 transition-colors">
                  {creator.display_name}
                </span>
              </Link>
            )}

            {video.duration_seconds && (
              <p className="text-xs text-jungle-600 mt-3">
                {formatDuration(video.duration_seconds)}
              </p>
            )}

            {video.description && (
              <p className="text-sm text-jungle-500 mt-3 line-clamp-3">
                {video.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: checkout flow */}
        <div className="lg:col-span-3">
          <Suspense>
            <CheckoutFlow
              videoId={video.id}
              priceSupported={video.price_supported}
              priceCommunity={video.price_community}
              priceAbundance={video.price_abundance}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
