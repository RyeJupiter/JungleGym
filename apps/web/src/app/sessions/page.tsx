import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Live Sessions' }

const FEATURED_TAGS = [
  'yoga', 'strength', 'mobility', 'hiit', 'kettlebell',
  'breathwork', 'meditation', 'bodyweight', 'flexibility', 'dance',
]

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>
}) {
  const { tag, q } = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // Fetch live + upcoming sessions
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
    liveQuery = liveQuery.ilike('title', `%${q}%`)
    upcomingQuery = upcomingQuery.ilike('title', `%${q}%`)
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

  // Tag filter — applied client-side via creator tags since sessions don't have tags
  function sessionMatchesTag(s: { creator_id: string }) {
    if (!tag) return true
    const profile = profileByCreatorId[s.creator_id]
    return profile?.tags?.includes(tag) ?? false
  }

  const filteredLive = (liveSessions ?? []).filter(sessionMatchesTag)
  const filteredUpcoming = (upcomingSessions ?? []).filter(sessionMatchesTag)
  const hasAnything = filteredLive.length > 0 || filteredUpcoming.length > 0

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-stone-900">Live Sessions</h1>
          <p className="text-stone-500 mt-2">
            Gift-based. No minimums. 80% of your gift goes to the creator.
          </p>
        </div>

        {/* Search */}
        <form method="get" className="mb-6">
          <div className="flex gap-3 max-w-lg">
            <input
              name="q"
              defaultValue={q ?? ''}
              placeholder="Search sessions..."
              className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-400 placeholder:text-stone-400"
            />
            {tag && <input type="hidden" name="tag" value={tag} />}
            <button type="submit" className="bg-jungle-700 hover:bg-jungle-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Search
            </button>
          </div>
        </form>

        {/* Tag pills */}
        <div className="flex gap-2 flex-wrap mb-10">
          <Link
            href={q ? `/sessions?q=${encodeURIComponent(q)}` : '/sessions'}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              !tag ? 'bg-jungle-900 text-white' : 'bg-white text-jungle-800 border border-jungle-200 hover:bg-jungle-50'
            }`}
          >
            All
          </Link>
          {FEATURED_TAGS.map((t) => (
            <Link
              key={t}
              href={q ? `/sessions?tag=${t}&q=${encodeURIComponent(q)}` : `/sessions?tag=${t}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${
                tag === t
                  ? 'bg-jungle-700 text-white'
                  : 'bg-white text-jungle-800 border border-jungle-200 hover:bg-jungle-50'
              }`}
            >
              {t}
            </Link>
          ))}
        </div>

        {!hasAnything ? (
          <div className="text-center py-20 text-stone-400">
            <div className="text-5xl mb-4">🌿</div>
            <p className="font-medium">
              {tag || q ? 'No sessions match your search.' : 'No sessions scheduled right now.'}
            </p>
            <p className="text-sm mt-1">Check back soon or explore videos in the meantime.</p>
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
        ) : (
          <div className="space-y-10">
            {/* Live now */}
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

            {/* Upcoming */}
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
}: {
  session: { id: string; title: string; description: string | null; scheduled_at: string; duration_minutes: number }
  creator: Creator
  isLive: boolean
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
        <p className="text-xs text-stone-400">Gift-based — give freely, no pressure</p>
      </div>
    </Link>
  )
}
