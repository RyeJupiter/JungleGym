import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { GiftButton } from '@/components/session/GiftButton'
import { AddSessionToCalendarButton } from '@/components/session/AddSessionToCalendarButton'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Live Sessions' }

export default async function SessionsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // Two separate queries for live vs upcoming — clearer than mixed status filter
  const [{ data: liveSessions }, { data: upcomingSessions }] = await Promise.all([
    supabase
      .from('live_sessions')
      .select('*')
      .eq('status', 'live')
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('live_sessions')
      .select('*')
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true }),
  ])

  // Two-step join: get creator profiles (no FK join — unreliable)
  const allSessions = [...(liveSessions ?? []), ...(upcomingSessions ?? [])]
  const creatorIds = [...new Set(allSessions.map((s) => s.creator_id))]
  const { data: creatorProfiles } = creatorIds.length
    ? await supabase.from('profiles').select('user_id, display_name, username, photo_url').in('user_id', creatorIds)
    : { data: [] }
  const profileByCreatorId = Object.fromEntries((creatorProfiles ?? []).map((p) => [p.user_id, p]))

  const hasAnything = (liveSessions ?? []).length > 0 || (upcomingSessions ?? []).length > 0

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-stone-900">Live Sessions</h1>
          <p className="text-stone-500 mt-2">
            Gift-based. No minimums. 100% of your gift goes to the creator.
          </p>
        </div>

        {!hasAnything ? (
          <div className="text-center py-20 text-stone-400">
            <div className="text-5xl mb-4">🌿</div>
            <p className="font-medium">No sessions scheduled right now.</p>
            <p className="text-sm mt-1">Check back soon or explore videos in the meantime.</p>
            <Link href="/explore" className="mt-4 inline-block text-jungle-600 font-semibold hover:underline">
              Browse videos →
            </Link>
          </div>
        ) : (
          <div className="space-y-10">

            {/* Live now */}
            {(liveSessions ?? []).length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Happening now
                </h2>
                <div className="space-y-4">
                  {liveSessions!.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      creator={profileByCreatorId[s.creator_id] ?? null}
                      isLive
                      authUserId={authUser?.id ?? null}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming */}
            {(upcomingSessions ?? []).length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-stone-900 mb-4">Upcoming</h2>
                <div className="space-y-4">
                  {upcomingSessions!.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      creator={profileByCreatorId[s.creator_id] ?? null}
                      isLive={false}
                      authUserId={authUser?.id ?? null}
                    />
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
      <FooterCompact />
    </div>
  )
}

type Creator = { display_name: string; username: string; photo_url: string | null } | null

function SessionCard({
  session: s,
  creator,
  isLive,
  authUserId,
}: {
  session: { id: string; title: string; description: string | null; scheduled_at: string; duration_minutes: number }
  creator: Creator
  isLive: boolean
  authUserId: string | null
}) {
  const scheduledDate = new Date(s.scheduled_at)

  return (
    <Link href={`/sessions/${s.id}`} className={`block bg-white rounded-2xl border p-6 ${isLive ? 'border-red-200 shadow-sm' : 'border-stone-200'} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-jungle-100 overflow-hidden flex items-center justify-center text-2xl flex-shrink-0">
            {creator?.photo_url ? (
              <img src={creator.photo_url} alt="" className="w-full h-full object-cover" />
            ) : '🌿'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {isLive && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  LIVE
                </span>
              )}
              <h3 className="font-bold text-stone-900">{s.title}</h3>
            </div>
            {creator && (
              <span className="text-sm text-jungle-700">{creator.display_name}</span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-stone-900">
            {scheduledDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <p className="text-xs text-stone-400">
            {scheduledDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </p>
          <p className="text-xs text-stone-400">{s.duration_minutes} min</p>
        </div>
      </div>

      {s.description && (
        <p className="text-stone-600 text-sm mt-3">{s.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-stone-400">🎁 Gift-based — give freely, no pressure</p>
      </div>
    </Link>
  )
}
