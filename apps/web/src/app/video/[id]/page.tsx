import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatPrice, formatDuration } from '@junglegym/shared'
import { PurchaseButton } from '@/components/video/PurchaseButton'
import { ShareButton } from '@/components/video/ShareButton'
import { AddToCalendarButton } from '@/components/video/AddToCalendarButton'
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
    .select('*, profiles!creator_id(display_name, username, photo_url, bio, tags)')
    .eq('id', id)
    .eq('published', true)
    .single()

  if (!video) notFound()

  const { data: { user } } = await supabase.auth.getUser()

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
  const creator = video.profiles as { display_name: string; username: string; photo_url: string | null; bio: string | null; tags: string[] } | null

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
      <header className="bg-white border-b border-stone-200 px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-black text-xl text-jungle-800">
          jungle<span className="text-jungle-500">gym</span>
        </Link>
        <Link href="/explore" className="text-sm text-stone-600 hover:text-stone-900 font-medium">
          ← Back to explore
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Video player / locked state */}
        <div className="bg-stone-900 rounded-2xl overflow-hidden mb-8 aspect-video flex items-center justify-center relative">
          {hasAccess ? (
            videoPlaybackUrl ? (
              <video
                src={videoPlaybackUrl}
                controls
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
                <p className="text-white font-bold text-lg mb-2">Choose your tier to drop in</p>
                <p className="text-white/60 text-sm">
                  {video.duration_seconds ? formatDuration(video.duration_seconds) : ''} of content
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: video info */}
          <div className="md:col-span-2">
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

            {/* Creator */}
            <Link href={creator?.username ? `/@${creator.username}` : '/explore'} className="flex items-center gap-3 group">
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

          {/* Right: pricing */}
          <div>
            {hasAccess ? (
              <div className="bg-jungle-50 border border-jungle-200 rounded-2xl p-5 text-center">
                <div className="text-3xl mb-2">✓</div>
                <p className="font-bold text-jungle-800">
                  {video.is_free ? 'Free access' : `Dropped in · ${purchase?.tier}`}
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
        </div>
      </div>
    </div>
  )
}
