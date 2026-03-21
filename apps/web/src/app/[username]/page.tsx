import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatPrice, formatDuration } from '@junglegym/shared'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return { title: `@${username}` }
}

export default async function CreatorProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createServerSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, users!user_id(role)')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('creator_id', profile.user_id)
    .eq('published', true)
    .order('created_at', { ascending: false })

  const { data: sessions } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('creator_id', profile.user_id)
    .in('status', ['scheduled', 'live'])
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(3)

  const freeVideos = (videos ?? []).filter((v) => v.is_free)
  const paidVideos = (videos ?? []).filter((v) => !v.is_free)

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Profile header */}
        <div className="flex items-start gap-6 mb-12">
          <div className="w-24 h-24 rounded-full bg-jungle-100 overflow-hidden flex items-center justify-center text-4xl flex-shrink-0">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
            ) : '🌿'}
          </div>
          <div>
            <h1 className="text-3xl font-black text-stone-900">{profile.display_name}</h1>
            <p className="text-stone-400 text-sm mb-2">@{profile.username}</p>
            {profile.tagline && (
              <p className="text-jungle-700 font-medium italic mb-2">&ldquo;{profile.tagline}&rdquo;</p>
            )}
            {profile.bio && <p className="text-stone-600 max-w-xl">{profile.bio}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.tags?.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/explore?tag=${tag}`}
                  className="bg-jungle-50 text-jungle-700 text-xs font-semibold px-3 py-1 rounded-full hover:bg-jungle-100 capitalize"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming sessions */}
        {(sessions ?? []).length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-black text-stone-900 mb-4">Upcoming sessions</h2>
            <div className="space-y-3">
              {sessions!.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-stone-200 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-stone-900 text-sm">{s.title}</p>
                    <p className="text-xs text-stone-400">
                      {new Date(s.scheduled_at).toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })} · {s.duration_minutes} min
                    </p>
                  </div>
                  <span className="text-xs bg-jungle-50 text-jungle-700 px-3 py-1 rounded-full font-semibold">
                    🎁 Gift-based
                  </span>
                </div>
              ))}
            </div>
            <Link href="/sessions" className="text-sm text-jungle-600 font-semibold hover:underline mt-3 inline-block">
              All sessions →
            </Link>
          </section>
        )}

        {/* Free videos */}
        {freeVideos.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-black text-stone-900 mb-4">Free videos</h2>
            <VideoGrid videos={freeVideos} />
          </section>
        )}

        {/* Paid videos */}
        {paidVideos.length > 0 && (
          <section>
            <h2 className="text-xl font-black text-stone-900 mb-4">Paid content</h2>
            <VideoGrid videos={paidVideos} />
          </section>
        )}
      </div>
    </div>
  )
}

function VideoGrid({ videos }: { videos: { id: string; title: string; thumbnail_url: string | null; duration_seconds: number | null; is_free: boolean; price_supported: number | null }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((v) => (
        <Link key={v.id} href={`/video/${v.id}`}>
          <div className="bg-white rounded-xl overflow-hidden border border-stone-200 hover:border-jungle-300 transition-colors group">
            <div className="aspect-video bg-stone-100 relative">
              {v.thumbnail_url ? (
                <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🌿</div>
              )}
              {v.is_free && (
                <span className="absolute top-2 left-2 bg-jungle-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">Free</span>
              )}
              {v.duration_seconds && (
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  {formatDuration(v.duration_seconds)}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="font-bold text-stone-900 text-sm group-hover:text-jungle-700 transition-colors">
                {v.title}
              </p>
              {!v.is_free && v.price_supported && (
                <p className="text-xs text-stone-400 mt-0.5">from {formatPrice(v.price_supported)}</p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
