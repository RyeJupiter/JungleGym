import Link from 'next/link'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { formatDuration } from '@junglegym/shared'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'A friend sent you a class',
  robots: { index: false, follow: false },
}

type Props = { params: Promise<{ token: string }> }

type ShareLookup = {
  video: {
    id: string
    title: string
    description: string | null
    thumbnail_url: string | null
    duration_seconds: number | null
  }
  creator: {
    display_name: string | null
    username: string | null
    photo_url: string | null
  } | null
  owner: {
    display_name: string | null
    username: string | null
  } | null
  redeemedByOther: boolean
  redeemedBySelf: boolean
  ownedBySelf: boolean
}

async function lookupShare(token: string, viewerId: string | null): Promise<ShareLookup | null> {
  const svc = await createServiceSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: share } = await (svc as any)
    .from('video_shares')
    .select('video_id, owner_user_id, redeemed_by')
    .eq('token', token)
    .maybeSingle()

  if (!share) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: video } = await (svc as any)
    .from('videos')
    .select('id, title, description, thumbnail_url, duration_seconds, creator_id')
    .eq('id', share.video_id)
    .is('deleted_at', null)
    .single()

  if (!video) return null

  const profileIds = [video.creator_id, share.owner_user_id].filter(Boolean) as string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (svc as any)
    .from('profiles')
    .select('user_id, display_name, username, photo_url')
    .in('user_id', profileIds)

  const profileMap = new Map<string, { user_id: string; display_name: string | null; username: string | null; photo_url: string | null }>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profiles ?? []).map((p: any) => [p.user_id, p]),
  )

  const creator = profileMap.get(video.creator_id) ?? null
  const owner = profileMap.get(share.owner_user_id) ?? null

  // Does the viewer already own this video?
  let ownedBySelf = false
  if (viewerId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (svc as any)
      .from('purchases')
      .select('id')
      .eq('user_id', viewerId)
      .eq('video_id', video.id)
      .or('expires_at.is.null,expires_at.gt.now()')
      .maybeSingle()
    ownedBySelf = !!existing
  }

  return {
    video: {
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnail_url,
      duration_seconds: video.duration_seconds,
    },
    creator: creator ? { display_name: creator.display_name, username: creator.username, photo_url: creator.photo_url } : null,
    owner: owner ? { display_name: owner.display_name, username: owner.username } : null,
    redeemedByOther: !!share.redeemed_by && share.redeemed_by !== viewerId,
    redeemedBySelf: !!share.redeemed_by && share.redeemed_by === viewerId,
    ownedBySelf,
  }
}

export default async function ShareLandingPage({ params }: Props) {
  const { token } = await params

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const viewerId = user?.id ?? null

  const share = await lookupShare(token, viewerId)

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {!share ? (
          <ExpiredCard
            title="This link doesn't work"
            message="It might have been mistyped, or the share was revoked. Double-check with the person who sent it to you."
          />
        ) : share.redeemedByOther ? (
          <ExpiredCard
            title="This share has already been claimed"
            message="Only one person can redeem each share link. Reach out to your friend for a fresh one, or grab this class yourself."
            videoId={share.video.id}
          />
        ) : (
          <ShareCard share={share} token={token} viewerSignedIn={!!user} />
        )}
      </main>
      <FooterCompact />
    </div>
  )
}

function ShareCard({
  share,
  token,
  viewerSignedIn,
}: {
  share: ShareLookup
  token: string
  viewerSignedIn: boolean
}) {
  const { video, creator, owner } = share
  const senderName = owner?.display_name ?? (owner?.username ? `@${owner.username}` : 'A friend')
  const creatorName = creator?.display_name ?? (creator?.username ? `@${creator.username}` : 'a JungleGym guide')

  const nextParam = `/share/${token}`
  const loginHref = `/auth/login?next=${encodeURIComponent(nextParam)}`
  const signupHref = `/auth/signup?next=${encodeURIComponent(nextParam)}`
  const redeemHref = `/api/share/${token}`

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Banner */}
      <div className="bg-gradient-to-br from-jungle-600 to-jungle-800 px-6 py-10 text-center">
        <div className="text-4xl mb-2">🎁</div>
        <p className="text-white/80 text-sm font-semibold uppercase tracking-wider">
          {senderName} sent you a class
        </p>
        <h1 className="text-white text-2xl sm:text-3xl font-black mt-1">
          30 days of free access
        </h1>
      </div>

      {/* Video preview */}
      <div className="px-6 pt-6">
        <div className="aspect-video bg-stone-100 rounded-2xl overflow-hidden relative">
          {video.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🌿</div>
          )}
          {video.duration_seconds && (
            <span className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {formatDuration(video.duration_seconds)}
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="px-6 pt-5 pb-6">
        <h2 className="font-black text-stone-900 text-xl leading-snug">{video.title}</h2>
        <p className="text-sm text-stone-500 mt-1">with {creatorName}</p>
        {video.description && (
          <p className="text-sm text-stone-600 leading-relaxed mt-4 line-clamp-4">
            {video.description}
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pb-8">
        {share.ownedBySelf ? (
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 text-center">
            <p className="text-stone-700 text-sm font-semibold mb-3">
              You already have access to this class.
            </p>
            <Link
              href={`/video/${video.id}`}
              className="inline-block bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors"
            >
              Go to the class
            </Link>
          </div>
        ) : share.redeemedBySelf ? (
          <div className="bg-jungle-50 border border-jungle-200 rounded-2xl p-5 text-center">
            <div className="text-2xl mb-1">✓</div>
            <p className="text-jungle-800 text-sm font-semibold mb-3">
              You&apos;ve already redeemed this. Your access is active.
            </p>
            <Link
              href={`/video/${video.id}`}
              className="inline-block bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors"
            >
              Watch now
            </Link>
          </div>
        ) : viewerSignedIn ? (
          <a
            href={redeemHref}
            className="block w-full bg-earth-500 hover:bg-earth-600 text-white font-black py-4 rounded-xl text-center transition-colors"
          >
            Redeem your 30 days →
          </a>
        ) : (
          <div className="space-y-3">
            <Link
              href={signupHref}
              className="block w-full bg-earth-500 hover:bg-earth-600 text-white font-black py-4 rounded-xl text-center transition-colors"
            >
              Create a free account to redeem
            </Link>
            <Link
              href={loginHref}
              className="block w-full bg-white hover:bg-stone-50 text-stone-700 font-semibold py-3 rounded-xl text-center border border-stone-200 transition-colors text-sm"
            >
              Already on JungleGym? Sign in
            </Link>
            <p className="text-xs text-stone-400 text-center pt-2">
              Signing up is free. You&apos;ll get 30 days of access to this class — your friend&apos;s treat.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ExpiredCard({ title, message, videoId }: { title: string; message: string; videoId?: string }) {
  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 sm:p-10 text-center">
      <div className="text-4xl mb-3">🌿</div>
      <h1 className="font-black text-stone-900 text-xl mb-2">{title}</h1>
      <p className="text-stone-500 text-sm leading-relaxed mb-6 max-w-md mx-auto">{message}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {videoId && (
          <Link
            href={`/video/${videoId}`}
            className="bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors"
          >
            View this class
          </Link>
        )}
        <Link
          href="/explore"
          className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 px-6 rounded-xl text-sm transition-colors"
        >
          Explore classes
        </Link>
      </div>
    </div>
  )
}
