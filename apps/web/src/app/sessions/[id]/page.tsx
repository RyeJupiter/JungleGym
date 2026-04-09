import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { GiftButton } from '@/components/session/GiftButton'
import { AddSessionToCalendarButton } from '@/components/session/AddSessionToCalendarButton'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('live_sessions').select('title').eq('id', id).single()
  return { title: data?.title ?? 'Session' }
}

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: session } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (!session) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // Two-step: get creator profile
  const { data: profileRows } = await supabase
    .from('profiles')
    .select('display_name, username, photo_url, bio')
    .eq('user_id', session.creator_id)
    .limit(1)
  const creator = profileRows?.[0] ?? null

  const scheduledDate = new Date(session.scheduled_at)
  const isLive = session.status === 'live'
  const isPast = session.status === 'completed' || session.status === 'cancelled'

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-12">
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
            <span>
              {scheduledDate.toLocaleDateString(undefined, {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </span>
            <span>·</span>
            <span>
              {scheduledDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </span>
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
              <GiftButton sessionId={session.id} creatorName={creator?.display_name ?? ''} />
            )}
          </div>
        </div>

        {/* Creator card */}
        {creator && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8">
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-3">Hosted by</p>
            <Link href={`/@${creator.username}`} className="flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-full bg-jungle-100 overflow-hidden flex items-center justify-center text-2xl flex-shrink-0">
                {creator.photo_url ? (
                  <img src={creator.photo_url} alt="" className="w-full h-full object-cover" />
                ) : '🌿'}
              </div>
              <div>
                <p className="font-bold text-stone-900 group-hover:text-jungle-700 transition-colors">
                  {creator.display_name}
                </p>
                <p className="text-sm text-stone-400">@{creator.username}</p>
              </div>
            </Link>
            {creator.bio && (
              <p className="text-stone-500 text-sm mt-3 line-clamp-3">{creator.bio}</p>
            )}
          </div>
        )}

        {/* Placeholder for future features */}
        <div className="bg-jungle-50 border border-jungle-200 rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">🌿</p>
          <p className="font-bold text-jungle-800 mb-1">
            {isLive ? 'The session is happening now!' : isPast ? 'This session has ended.' : 'Session starts soon'}
          </p>
          <p className="text-jungle-600 text-sm">
            {isLive
              ? 'Live stream, comments, and gifts are coming soon. For now, connect with the teacher directly.'
              : isPast
              ? 'Thanks for attending! Check out more sessions below.'
              : `Come back ${scheduledDate.toLocaleDateString(undefined, { weekday: 'long' })} to join.`
            }
          </p>
          <Link href="/sessions" className="mt-4 inline-block text-jungle-700 font-semibold text-sm hover:underline">
            Browse all sessions →
          </Link>
        </div>
      </div>
    </div>
  )
}
