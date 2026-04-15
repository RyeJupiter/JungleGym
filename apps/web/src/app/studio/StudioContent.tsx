import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { VideoRow } from '@/components/studio/VideoRow'
import { PastSessionsDropdown } from '@/components/studio/PastSessionsDropdown'

export async function StudioSessions({ userId }: { userId: string }) {
  const supabase = await createServerSupabaseClient()

  const { data: allSessions } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('creator_id', userId)
    .order('scheduled_at', { ascending: false })

  const activeSessions = (allSessions ?? []).filter((s) =>
    s.status === 'live' || s.status === 'scheduled'
  )
  const pastSessions = (allSessions ?? []).filter((s) =>
    s.status === 'completed' || s.status === 'cancelled'
  )

  if (activeSessions.length === 0 && pastSessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
        <p className="text-4xl mb-3">📅</p>
        <p className="font-medium">No sessions yet</p>
        <p className="text-sm mt-1">Schedule your first live session.</p>
      </div>
    )
  }

  return (
    <>
      {activeSessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-4">
          {activeSessions.map((s, i) => (
            <SessionRow key={s.id} session={s} index={i} />
          ))}
        </div>
      )}
      {activeSessions.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center text-stone-400 mb-4">
          <p className="text-sm">No upcoming sessions.</p>
        </div>
      )}
      {pastSessions.length > 0 && (
        <PastSessionsDropdown sessions={pastSessions} />
      )}
    </>
  )
}

export async function StudioVideos({ userId }: { userId: string }) {
  const supabase = await createServerSupabaseClient()

  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })

  if ((videos ?? []).length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
        <p className="text-4xl mb-3">🎬</p>
        <p className="font-medium">No videos yet</p>
        <p className="text-sm mt-1">Upload your first video to start sharing.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      {videos!.map((v, i) => (
        <VideoRow key={v.id} video={v} index={i} />
      ))}
    </div>
  )
}

function SessionRow({ session: s, index }: { session: { id: string; title: string; scheduled_at: string; duration_minutes: number; status: string }; index: number }) {
  const isLive = s.status === 'live'
  return (
    <div className={`flex items-center justify-between px-5 py-4 ${index > 0 ? 'border-t border-stone-100' : ''}`}>
      <Link href={`/sessions/${s.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
        <p className="font-semibold text-stone-900 text-sm">{s.title}</p>
        <p className="text-xs text-stone-400 mt-0.5">
          {new Date(s.scheduled_at).toLocaleDateString(undefined, {
            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
          })} · {s.duration_minutes} min
        </p>
      </Link>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
          isLive ? 'bg-red-50 text-red-600' :
          s.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
          'bg-stone-100 text-stone-500'
        }`}>
          {s.status}
        </span>
        <Link
          href={`/studio/sessions/${s.id}/manage`}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
        >
          Manage
        </Link>
      </div>
    </div>
  )
}
