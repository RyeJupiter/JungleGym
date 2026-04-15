import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LocalTime } from '@/components/LocalTime'

type Creator = { display_name: string; username: string; photo_url: string | null } | null

export async function SessionsContent({ q, tag }: { q?: string; tag?: string }) {
  const supabase = await createServerSupabaseClient()

  let liveQuery = supabase
    .from('live_sessions')
    .select('*')
    .eq('status', 'live')
    .order('scheduled_at', { ascending: true })

  let upcomingQuery = supabase
    .from('live_sessions')
    .select('*')
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })

  if (q) {
    liveQuery = liveQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    upcomingQuery = upcomingQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  }

  const [{ data: liveSessions }, { data: upcomingSessions }] = await Promise.all([
    liveQuery,
    upcomingQuery,
  ])

  // Two-step join: get creator profiles
  const allSessions = [...(liveSessions ?? []), ...(upcomingSessions ?? [])]
  const creatorIds = [...new Set(allSessions.map((s) => s.creator_id))]
  const { data: creatorProfiles } = creatorIds.length
    ? await supabase.from('profiles').select('user_id, display_name, username, photo_url, tags').in('user_id', creatorIds)
    : { data: [] }
  const profileByCreatorId = Object.fromEntries((creatorProfiles ?? []).map((p) => [p.user_id, p]))

  function sessionMatchesTag(s: { creator_id: string }) {
    if (!tag) return true
    const profile = profileByCreatorId[s.creator_id]
    return profile?.tags?.includes(tag) ?? false
  }

  const filteredLive = (liveSessions ?? []).filter(sessionMatchesTag)
  const filteredUpcoming = (upcomingSessions ?? []).filter(sessionMatchesTag)
  const hasAnything = filteredLive.length > 0 || filteredUpcoming.length > 0

  if (!hasAnything) {
    return (
      <div className="text-center py-20 text-stone-400">
        <div className="text-5xl mb-4">🌿</div>
        <p className="font-medium text-stone-600">
          {tag || q ? 'No sessions match your search.' : 'No sessions scheduled right now.'}
        </p>
        <p className="text-sm mt-1 text-stone-400">Check back soon or explore videos in the meantime.</p>
        {(tag || q) ? (
          <Link href="/sessions" className="mt-3 inline-block text-jungle-600 font-semibold hover:underline text-sm">
            Clear filters →
          </Link>
        ) : (
          <Link href="/classes" className="mt-4 inline-block text-jungle-600 font-semibold hover:underline">
            Browse classes →
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {filteredLive.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Happening now
          </h2>
          <div className="space-y-4">
            {filteredLive.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                creator={profileByCreatorId[s.creator_id] ?? null}
                isLive
              />
            ))}
          </div>
        </section>
      )}

      {filteredUpcoming.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-stone-900 mb-4">Upcoming</h2>
          <div className="space-y-4">
            {filteredUpcoming.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                creator={profileByCreatorId[s.creator_id] ?? null}
                isLive={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SessionCard({
  session: s,
  creator,
  isLive,
}: {
  session: { id: string; title: string; description: string | null; scheduled_at: string; duration_minutes: number }
  creator: Creator
  isLive: boolean
}) {
  const scheduledDate = new Date(s.scheduled_at)

  return (
    <Link href={`/sessions/${s.id}`} className={`block bg-white rounded-2xl border p-6 ${isLive ? 'border-red-300' : 'border-stone-200'} hover:border-jungle-400 hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center text-2xl flex-shrink-0">
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
              <span className="text-sm text-stone-500">{creator.display_name}</span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-stone-700">
            <LocalTime iso={s.scheduled_at} options={{ weekday: 'short', month: 'short', day: 'numeric' }} />
          </p>
          <p className="text-xs text-stone-400">
            <LocalTime iso={s.scheduled_at} options={{ hour: 'numeric', minute: '2-digit' }} />
          </p>
          <p className="text-xs text-stone-400">{s.duration_minutes} min</p>
        </div>
      </div>

      {s.description && (
        <p className="text-stone-500 text-sm mt-3">{s.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-stone-400">Gift-based — give freely, no pressure</p>
      </div>
    </Link>
  )
}
