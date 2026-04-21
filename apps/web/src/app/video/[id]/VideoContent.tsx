import { Suspense } from 'react'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatPrice, formatDuration } from '@junglegym/shared'
import { PurchaseButton } from '@/components/video/PurchaseButton'
import { PurchaseConfirm } from '@/components/video/PurchaseConfirm'
import { ShareButton } from '@/components/video/ShareButton'
import { AddToCalendarButton } from '@/components/video/AddToCalendarButton'
import { checkIsAdmin, ADMIN_PREVIEW_COOKIE } from '@/lib/admin'

export async function VideoContent({ videoId }: { videoId: string }) {
  const supabase = await createServerSupabaseClient()

  const { data: video } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
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

  // Admin "preview all videos" override. The cookie is HttpOnly and only
  // set by the admin-only server action, but we still gate honoring it on
  // isAdmin — a non-admin who somehow gets this cookie set gains nothing.
  const previewCookie = (await cookies()).get(ADMIN_PREVIEW_COOKIE)?.value === '1'
  const adminPreview = isAdmin && previewCookie

  // Check if learner already purchased this (or has active share access)
  const { data: purchase } = user
    ? await supabase
        .from('purchases')
        .select('tier, expires_at')
        .eq('user_id', user.id)
        .eq('video_id', video.id)
        .or('expires_at.is.null,expires_at.gt.now()')
        .maybeSingle()
    : { data: null }

  const hasAccess = video.is_free || !!purchase || adminPreview
  const sharedAccess = !!purchase?.expires_at

  // Pre-fetch the user's own share for this video (if any) so the ShareButton
  // can render "✓ Shared with [Name]" before any click. video_shares RLS
  // only returns rows where owner_user_id = auth.uid(), so this is private
  // to the owner. profiles is publicly readable — no RLS issues there.
  let initialShare: {
    token: string
    redeemedAt: string | null
    redeemerName: string | null
  } | null = null
  if (user && !video.is_free) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ownShare } = await (supabase as any)
      .from('video_shares')
      .select('token, redeemed_by, redeemed_at')
      .eq('owner_user_id', user.id)
      .eq('video_id', video.id)
      .maybeSingle()

    if (ownShare) {
      let redeemerName: string | null = null
      if (ownShare.redeemed_by) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: redeemerProfile } = await (supabase as any)
          .from('profiles')
          .select('display_name')
          .eq('user_id', ownShare.redeemed_by)
          .maybeSingle()
        redeemerName = (redeemerProfile?.display_name as string | null) ?? null
      }
      initialShare = {
        token: ownShare.token as string,
        redeemedAt: (ownShare.redeemed_at as string | null) ?? null,
        redeemerName,
      }
    }
  }

  // Generate signed URL for private video bucket. For admin preview we must
  // use the service client because storage RLS requires a purchase row or
  // creator ownership, neither of which the admin has.
  let videoPlaybackUrl: string | null = null
  if (hasAccess && video.video_url) {
    if (video.video_url.startsWith('http')) {
      videoPlaybackUrl = video.video_url
    } else {
      const signer =
        adminPreview && !video.is_free && !purchase && video.creator_id !== user?.id
          ? createServiceSupabaseClient()
          : supabase
      const { data: signed } = await signer.storage
        .from('videos')
        .createSignedUrl(video.video_url, 3600)
      videoPlaybackUrl = signed?.signedUrl ?? null
    }
  }

  // Caption track — transcripts bucket is public, so getPublicUrl works for
  // everyone without needing a signed URL.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vttPath = (video as any).transcript_vtt_path as string | null | undefined
  let captionsUrl: string | null = null
  if (vttPath) {
    const { data } = supabase.storage.from('transcripts').getPublicUrl(vttPath)
    captionsUrl = data.publicUrl
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <Suspense>
        <PurchaseConfirm />
      </Suspense>
      {/* Video player / locked state */}
      <div className="bg-stone-900 rounded-2xl overflow-hidden mb-6 sm:mb-8 aspect-video flex items-center justify-center relative">
        {hasAccess ? (
          videoPlaybackUrl ? (
            <video
              src={videoPlaybackUrl}
              controls
              controlsList="nodownload"
              playsInline
              // Required for cross-origin <track> (VTT lives on Supabase
              // storage; document is on junglegym.academy). Without it
              // the browser silently refuses to load the track, so no
              // CC button appears. Supabase storage responds with
              // Access-Control-Allow-Origin: *, so the video itself
              // continues to load normally in CORS mode.
              crossOrigin="anonymous"
              className="w-full h-full"
              poster={video.thumbnail_url ?? undefined}
            >
              {captionsUrl && (
                <track
                  kind="captions"
                  label="English"
                  srcLang="en"
                  src={captionsUrl}
                  default
                />
              )}
            </video>
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
            <span className="bg-jungle-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              Free
            </span>
          )}
          {video.tags.map((tag: string) => (
            <Link
              key={tag}
              href={`/explore?tag=${tag}`}
              className="bg-stone-100 text-stone-600 text-xs px-2 py-1 rounded-full hover:bg-stone-200 capitalize border border-stone-200"
            >
              {tag}
            </Link>
          ))}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mb-3 break-words">{video.title}</h1>

        {video.description && (
          <p className="text-stone-600 leading-relaxed mb-6">{video.description}</p>
        )}

        {/* Payment — full width, directly under description */}
        <div className="mb-8">
          {hasAccess ? (
            <div className={`rounded-2xl p-5 text-center ${
              adminPreview && !purchase && !video.is_free
                ? 'bg-red-50 border border-red-200'
                : 'bg-jungle-50 border border-jungle-200'
            }`}>
              <div className="text-3xl mb-2">{adminPreview && !purchase && !video.is_free ? '👁️' : '✓'}</div>
              <p className={`font-bold ${
                adminPreview && !purchase && !video.is_free ? 'text-red-800' : 'text-jungle-800'
              }`}>
                {adminPreview && !purchase && !video.is_free
                  ? 'Admin preview mode'
                  : video.is_free
                    ? 'Free access'
                    : sharedAccess
                      ? 'Shared access'
                      : `Unlocked (${purchase?.tier})`}
              </p>
              {sharedAccess && purchase?.expires_at && (
                <p className="text-xs text-jungle-700 mt-1">
                  Expires {new Date(purchase.expires_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
              <AddToCalendarButton videoTitle={video.title} videoId={video.id} />
              {!video.is_free && !sharedAccess && (
                <ShareButton
                  videoId={video.id}
                  isLoggedIn={!!user}
                  initialShare={initialShare}
                />
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
          <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center text-xl flex-shrink-0">
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
  )
}
