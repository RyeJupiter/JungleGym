import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { GiftButton } from '@/components/session/GiftButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Live Sessions' }

export default async function SessionsPage() {
  const supabase = createServerSupabaseClient()

  const { data: sessions } = await supabase
    .from('live_sessions')
    .select('*, profiles!creator_id(display_name, username, photo_url)')
    .in('status', ['scheduled', 'live'])
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })

  const { data: { session: authSession } } = await supabase.auth.getSession()

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-black text-xl text-jungle-800">
          jungle<span className="text-jungle-500">gym</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-stone-600">
          <Link href="/explore" className="hover:text-stone-900">Explore</Link>
          <Link href="/sessions" className="text-jungle-700 font-bold">Sessions</Link>
          {authSession ? (
            <Link href="/dashboard" className="hover:text-stone-900">Dashboard</Link>
          ) : (
            <Link href="/auth/login" className="hover:text-stone-900">Sign in</Link>
          )}
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-stone-900">Live Sessions</h1>
          <p className="text-stone-500 mt-2">
            Gift-based. No minimums. 100% of your gift goes to the creator.
          </p>
        </div>

        {(sessions ?? []).length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <div className="text-5xl mb-4">🌿</div>
            <p className="font-medium">No sessions scheduled right now.</p>
            <p className="text-sm mt-1">Check back soon or explore videos in the meantime.</p>
            <Link href="/explore" className="mt-4 inline-block text-jungle-600 font-semibold hover:underline">
              Browse videos →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions!.map((s) => {
              const creator = s.profiles as { display_name: string; username: string; photo_url: string | null } | null
              const scheduledDate = new Date(s.scheduled_at)
              const isLive = s.status === 'live'

              return (
                <div key={s.id} className="bg-white rounded-2xl border border-stone-200 p-6">
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
                        <Link href={`/@${creator?.username}`} className="text-sm text-jungle-700 hover:underline">
                          {creator?.display_name}
                        </Link>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-stone-900">
                        {scheduledDate.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-stone-400">
                        {scheduledDate.toLocaleTimeString(undefined, {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs text-stone-400">{s.duration_minutes} min</p>
                    </div>
                  </div>

                  {s.description && (
                    <p className="text-stone-600 text-sm mt-3">{s.description}</p>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-stone-400">
                      🎁 Gift-based — give freely, no pressure
                    </p>
                    {isLive && authSession && (
                      <GiftButton sessionId={s.id} creatorName={creator?.display_name ?? ''} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
