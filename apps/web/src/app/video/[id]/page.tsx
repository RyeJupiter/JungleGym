import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatPrice, formatDuration } from '@junglegym/shared'
import { PurchaseButton } from '@/components/video/PurchaseButton'
import { PurchaseConfirm } from '@/components/video/PurchaseConfirm'
import { ShareButton } from '@/components/video/ShareButton'
import { AddToCalendarButton } from '@/components/video/AddToCalendarButton'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { checkIsAdmin } from '@/lib/admin'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('videos').select('title').eq('id', id).single()
  return { title: data?.title ?? 'Video' }
}

export default async function VideoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: video } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .single()

  if (!video) notFound()

  // Two-step join for creator profile
  const [{ data: { user } }, { data: profileRows }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('profiles').select('display_name, username, photo_url, bio, tags').eq('user_id', video.creator_id).limit(1),
  ])
  const creator = profileRows?.[0] ?? null

  const isAdmin = user?.email ? await checkIsAdmin(user.email, supabase) : false

  // Check if learner already purchased this
  const { data: purchase } = user
    ? await supabase
        .from('purchases')
        .select('tier')
        .eq('user_id', user.id)
        .eq('video_id', video.id)
        .maybeSingle()
    : { data: null }

  const hasAccess = video.is_free || !!purchase

  // Generate signed URL for private video bucket
  let videoPlaybackUrl: string | null = null
  if (hasAccess && video.video_url) {
    if (video.video_url.startsWith('http')) {
      videoPlaybackUrl = video.video_url
    } else {
      const { data: signed } = await supabase.storage
        .from('videos')
        .createSignedUrl(video.video_url, 3600)
      videoPlaybackUrl = signed?.signedUrl ?? null
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Suspense>
          <PurchaseConfirm />
        </Suspense>
        {/* Video player / locked state */}
        <div className="bg-stone-900 rounded-2xl overflow-hidden mb-8 aspect-video flex items-center justify-center relative">
          {hasAccess ? (
            videoPlaybackUrl ? (
              <video
                src={videoPlaybackUrl}
                controls
                controlsList="nodownload"
                playsInline
                className="w-full h-full"
                poster={video.thumbnail_url ?? undefined}
              />
            ) : (
              <p className="text-white/50 text-sm">Video coming soon</p>
            )
          ) : (
            <div className="text-center px-8">
              {video.thumbnail_url && (
                <img
                  src={video.thumbnail_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
              )}
              <div className="relative z-10">
                <div className="text-5xl mb-4">🔒</div>
                <p className="text-white font-bold text-lg mb-2">Choose your tier to unlock</p>
                <p className="text-white/60 text-sm">
                  {video.duration_seconds ? formatDuration(video.duration_seconds) : ''} of content
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {video.is_free && (
              <span className="bg-jungle-100 text-jungle-800 text-xs font-bold px-2 py-1 rounded-full">
                Free
              </span>
            )}
            {video.tags.map((tag) => (
              <Link
                key={tag}
                href={`/explore?tag=${tag}`}
                className="bg-stone-100 text-stone-600 text-xs px-2 py-1 rounded-full hover:bg-stone-200 capitalize"
              >
                {tag}
              </Link>
            ))}
          </div>

          <h1 className="text-3xl font-black text-stone-900 mb-3">{video.title}</h1>

          {video.description && (
            <p className="text-stone-600 leading-relaxed mb-6">{video.description}</p>
          )}

          {/* Payment — full width, directly under description */}
          <div className="mb-8">
            {hasAccess ? (
              <div className="bg-jungle-50 border border-jungle-200 rounded-2xl p-5 text-center">
                <div className="text-3xl mb-2">✓</div>
                <p className="font-bold text-jungle-800">
                  {video.is_free ? 'Free access' : `Unlocked (${purchase?.tier})`}
                </p>
                <AddToCalendarButton videoTitle={video.title} videoId={video.id} />
                {!video.is_free && (
                  <ShareButton videoId={video.id} isLoggedIn={!!user} />
                )}
              </div>
            ) : (
              <PurchaseButton
                videoId={video.id}
                priceSupported={video.price_supported}
                priceCommunity={video.price_community}
                priceAbundance={video.price_abundance}
                isLoggedIn={!!user}
              />
            )}
          </div>

          {/* Ghost tags — admin only */}
          {isAdmin && (video.ghost_tags?.length > 0) && (
            <div className="mb-6 p-3 rounded-xl bg-violet-50 border border-violet-200">
              <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-2">
                Ghost tags (admin only)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {video.ghost_tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Creator */}
          <Link href={`/@${creator?.username}`} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-jungle-100 overflow-hidden flex items-center justify-center text-xl flex-shrink-0">
              {creator?.photo_url ? (
                <img src={creator.photo_url} alt="" className="w-full h-full object-cover" />
              ) : '🌿'}
            </div>
            <div>
              <p className="font-bold text-stone-900 group-hover:text-jungle-700 transition-colors">
                {creator?.display_name}
              </p>
              <p className="text-xs text-stone-400">@{creator?.username}</p>
            </div>
          </Link>
        </div>
      </div>
      <FooterCompact />
    </div>
  )
}
