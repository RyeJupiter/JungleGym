import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GiftButton } from '@/components/session/GiftButton'
import { AddSessionToCalendarButton } from '@/components/session/AddSessionToCalendarButton'
import { StreamPlaceholder } from '@/components/session/StreamPlayer'
import { getPlaybackUrls } from '@/lib/cloudflare-stream'
import { LocalTime } from '@/components/LocalTime'
import { SessionAutoRefresh } from '@/components/session/SessionAutoRefresh'
import { LiveSessionWrapper } from '@/components/session/LiveSessionWrapper'

export async function SessionContent({ sessionId }: { sessionId: string }) {
  const supabase = await createServerSupabaseClient()

  const { data: session } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (!session) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // Two-step: get creator profile
  const { data: profileRows } = await supabase
    .from('profiles')
    .select('display_name, username, photo_url, bio, suggested_tip')
    .eq('user_id', session.creator_id)
    .limit(1)
  const creator = profileRows?.[0] ?? null

  const isLive = session.status === 'live'
  const isPast = session.status === 'completed' || session.status === 'cancelled'

  const cfInputId = (session as Record<string, unknown>).cf_input_id as string | null
  const pausedAt = (session as Record<string, unknown>).paused_at as string | null
  const playbackUrls = cfInputId ? getPlaybackUrls(cfInputId) : null

  // Diagnostic: check CF live input settings (logged server-side)
  if (cfInputId && isLive) {
    const cfToken = process.env.CLOUDFLARE_STREAM_API_TOKEN
    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID
    if (cfToken && cfAccountId) {
      fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/stream/live_inputs/${cfInputId}`, {
        headers: { Authorization: `Bearer ${cfToken}` },
      })
        .then(r => r.json())
        .then(data => {
          console.log('[CF Diagnostic] live input config:', JSON.stringify({
            uid: data.result?.uid,
            requireSignedURLs: data.result?.recording?.requireSignedURLs,
            mode: data.result?.recording?.mode,
            allowedOrigins: data.result?.recording?.allowedOrigins,
            status: data.result?.status,
          }))
        })
        .catch(err => console.error('[CF Diagnostic] failed:', err.message))
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Auto-refresh poller (only when no stream player — LiveSessionWrapper has its own) */}
      {!(playbackUrls && (isLive || isPast)) && (
        <SessionAutoRefresh sessionId={session.id} currentStatus={session.status} />
      )}

      {/* Status banner */}
      {isLive && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 mb-8 flex items-center gap-3">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
          <p className="text-red-700 font-bold">This session is live right now</p>
        </div>
      )}

      {isPast && (
        <div className="bg-stone-100 border border-stone-200 rounded-2xl px-6 py-4 mb-8">
          <p className="text-stone-500 font-medium capitalize">This session has {session.status}.</p>
        </div>
      )}

      {/* Session info */}
      <div className="mb-8">
        <Link href="/sessions" className="text-sm text-stone-400 hover:text-stone-600 transition-colors mb-3 inline-block">
          ← All sessions
        </Link>
        <h1 className="text-3xl font-black text-stone-900 mb-3">{session.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 mb-4">
          <LocalTime iso={session.scheduled_at} options={{ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }} />
          <span>·</span>
          <LocalTime iso={session.scheduled_at} options={{ hour: 'numeric', minute: '2-digit' }} />
          <span>·</span>
          <span>{session.duration_minutes} min</span>
          {session.max_participants && (
            <>
              <span>·</span>
              <span>Max {session.max_participants} participants</span>
            </>
          )}
        </div>

        {session.description && (
          <p className="text-stone-600 leading-relaxed mb-6">{session.description}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 flex-wrap">
          {!isPast && <AddSessionToCalendarButton session={session} />}
          {isLive && user && (
            <GiftButton sessionId={session.id} creatorName={creator?.display_name ?? ''} suggestedTip={((creator as unknown as Record<string, unknown>)?.suggested_tip as number) ?? 5} />
          )}
        </div>
      </div>

      {/* Stream player or placeholder */}
      {playbackUrls && (isLive || isPast) ? (
        <LiveSessionWrapper
          sessionId={session.id}
          currentStatus={session.status}
          hlsSrc={playbackUrls.hls}
          isLive={isLive}
          isRecording={isPast}
          initialPaused={!!pausedAt}
        />
      ) : (
        <StreamPlaceholder
          isLive={isLive}
          isPast={isPast}
          scheduledAt={session.scheduled_at}
        />
      )}

      {/* Creator tile */}
      {creator && (
        <Link href={`/@${creator.username}`} className="flex items-center gap-3 bg-white rounded-xl border border-stone-200 px-4 py-3 mb-8 hover:border-jungle-400 transition-colors group w-fit">
          <div className="w-9 h-9 rounded-full bg-jungle-100 overflow-hidden flex items-center justify-center text-sm flex-shrink-0">
            {creator.photo_url ? (
              <img src={creator.photo_url} alt="" className="w-full h-full object-cover" />
            ) : '🌿'}
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900 group-hover:text-jungle-700 transition-colors leading-tight">
              {creator.display_name}
            </p>
            <p className="text-xs text-stone-400">@{creator.username}</p>
          </div>
        </Link>
      )}

      {!isPast && (
        <Link href="/sessions" className="mt-4 inline-block text-jungle-700 font-semibold text-sm hover:underline">
          Browse all sessions →
        </Link>
      )}
    </div>
  )
}
