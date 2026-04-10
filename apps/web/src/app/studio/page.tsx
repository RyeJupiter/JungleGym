import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { VideoRow } from '@/components/studio/VideoRow'
import { PurchaseToast } from '@/components/studio/PurchaseToast'
import { PastSessionsDropdown } from '@/components/studio/PastSessionsDropdown'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { checkIsAdmin } from '@/lib/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Studio' }

export default async function StudioPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: user } = await supabase
    .from('users').select('role').eq('id', authUser.id).single()
  if (user?.role !== 'creator') redirect('/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('notification_pref, notification_threshold')
    .eq('user_id', authUser.id)
    .single()

  const isAdmin = await checkIsAdmin(authUser.email ?? '', supabase)

  const [{ data: videos }, { data: allSessions }] = await Promise.all([
    supabase
      .from('videos')
      .select('*')
      .eq('creator_id', authUser.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('live_sessions')
      .select('*')
      .eq('creator_id', authUser.id)
      .order('scheduled_at', { ascending: false }),
  ])

  // Split sessions into active (live/scheduled) and past (completed/cancelled)
  const activeSessions = (allSessions ?? []).filter((s) =>
    s.status === 'live' || s.status === 'scheduled'
  )
  const pastSessions = (allSessions ?? []).filter((s) =>
    s.status === 'completed' || s.status === 'cancelled'
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <PurchaseToast
        creatorId={authUser.id}
        notificationPref={(profile?.notification_pref ?? 'every') as 'every' | 'daily' | 'weekly' | 'threshold' | 'off'}
        notificationThreshold={profile?.notification_threshold ?? 0}
      />
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-black text-stone-900">Studio</h1>
          <div className="flex gap-3">
            <Link
              href="/studio/upload"
              className="bg-jungle-600 hover:bg-jungle-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              + Upload video
            </Link>
            <Link
              href="/studio/sessions/new"
              className="bg-white hover:bg-stone-50 text-stone-800 font-semibold px-5 py-2.5 rounded-lg text-sm border border-stone-200 transition-colors"
            >
              + Schedule session
            </Link>
            <Link
              href="/settings"
              className="bg-white hover:bg-stone-50 text-stone-500 font-semibold px-5 py-2.5 rounded-lg text-sm border border-stone-200 transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Live sessions */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-stone-900 mb-4">Live sessions</h2>
          {activeSessions.length === 0 && pastSessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-medium">No sessions yet</p>
              <p className="text-sm mt-1">Schedule your first live session.</p>
            </div>
          ) : (
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
          )}
        </section>

        {/* Admin panel */}
        {isAdmin && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-jungle-100 text-jungle-700 px-2 py-0.5 rounded">Admin</span>
              Quick links
            </h2>
            <div className="bg-white rounded-2xl border border-jungle-200 p-6 space-y-4">
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">Creator invite page</p>
                <div className="flex items-center gap-3">
                  <code className="text-sm text-jungle-700 bg-jungle-50 px-3 py-1.5 rounded-lg flex-1">
                    junglegym.academy/welcome
                  </code>
                  <Link
                    href="/welcome"
                    target="_blank"
                    className="text-sm font-semibold text-jungle-600 hover:text-jungle-500 transition-colors whitespace-nowrap"
                  >
                    Preview →
                  </Link>
                </div>
                <p className="text-xs text-stone-400 mt-1.5">
                  Share this link in personal invites. Not indexed by search engines.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Videos */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-stone-900 mb-4">Your videos</h2>
          {(videos ?? []).length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
              <p className="text-4xl mb-3">🎬</p>
              <p className="font-medium">No videos yet</p>
              <p className="text-sm mt-1">Upload your first video to start sharing.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              {videos!.map((v, i) => (
                <VideoRow key={v.id} video={v} index={i} />
              ))}
            </div>
          )}
        </section>
      </div>
      <FooterCompact />
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
