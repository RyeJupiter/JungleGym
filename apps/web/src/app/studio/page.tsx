import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { VideoRow } from '@/components/studio/VideoRow'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Studio' }

export default async function StudioPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: user } = await supabase
    .from('users').select('role').eq('id', authUser.id).single()
  if (user?.role !== 'creator') redirect('/dashboard')

  const [{ data: videos }, { data: sessions }] = await Promise.all([
    supabase
      .from('videos')
      .select('*')
      .eq('creator_id', authUser.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('live_sessions')
      .select('*')
      .eq('creator_id', authUser.id)
      .order('scheduled_at', { ascending: false })
      .limit(5),
  ])

  return (
    <div className="min-h-screen bg-stone-50">
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
              className="bg-white hover:bg-stone-50 text-stone-800 font-semibold px-5 py-2.5 rounded-lg text-sm border border-stone-200 transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>

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

        {/* Sessions */}
        <section>
          <h2 className="text-xl font-bold text-stone-900 mb-4">Live sessions</h2>
          {(sessions ?? []).length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-medium">No sessions yet</p>
              <p className="text-sm mt-1">Schedule your first live session.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              {sessions!.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-stone-100' : ''}`}
                >
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">{s.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(s.scheduled_at).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      })} · {s.duration_minutes} min
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    s.status === 'live' ? 'bg-red-50 text-red-600' :
                    s.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                    'bg-stone-100 text-stone-500'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
