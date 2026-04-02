import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDuration, formatPrice } from '@junglegym/shared'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Library' }

export default async function LibraryPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: profile }, { data: userRow }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('user_id', authUser.id).single(),
    supabase.from('users').select('role').eq('id', authUser.id).single(),
  ])

  const isCreator = userRow?.role === 'creator'
  const firstName = profile?.display_name?.split(' ')[0] ?? null

  const [{ data: purchases }, { count: videoCount }, { count: sessionCount }] =
    await Promise.all([
      supabase
        .from('purchases')
        .select('*, videos(id, title, thumbnail_url, duration_seconds, tags, creator_id)')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false }),
      isCreator
        ? supabase.from('videos').select('*', { count: 'exact', head: true }).eq('creator_id', authUser.id)
        : Promise.resolve({ count: 0 }),
      supabase
        .from('live_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', authUser.id)
        .gte('scheduled_at', new Date().toISOString())
        .eq('status', 'scheduled'),
    ])

  // Two-step: get creator profiles for purchased videos
  const creatorIds = [...new Set((purchases ?? []).map((p) => {
    const v = p.videos as { creator_id: string } | null
    return v?.creator_id
  }).filter(Boolean))] as string[]

  const { data: creatorProfiles } = creatorIds.length
    ? await supabase.from('profiles').select('user_id, display_name, username').in('user_id', creatorIds)
    : { data: [] }
  const profileByCreatorId = Object.fromEntries((creatorProfiles ?? []).map((p) => [p.user_id, p]))

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-jungle-900">
            {firstName ? `Hey, ${firstName}` : 'Your Library'}
          </h1>
          <p className="text-jungle-600 mt-1">{isCreator ? 'Teacher' : 'Learner'}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
          <StatCard
            label={isCreator ? 'Your videos' : 'Purchased videos'}
            value={String(isCreator ? (videoCount ?? 0) : (purchases?.length ?? 0))}
            href={isCreator ? '/studio' : '#library'}
          />
          <StatCard label="Upcoming sessions" value={String(sessionCount ?? 0)} href="/sessions" />
          <StatCard label="Settings" value="→" href="/settings" />
        </div>

        {/* Creator: studio callout */}
        {isCreator && (
          <div className="bg-jungle-900 rounded-2xl p-8 mb-12">
            <h2 className="text-xl font-bold text-white mb-2">Your studio</h2>
            <p className="text-jungle-400 mb-5">Upload videos, schedule live sessions, and share what you love.</p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/studio/upload" className="bg-earth-400 hover:bg-earth-500 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
                Upload video
              </Link>
              <Link href="/studio/sessions/new" className="bg-jungle-800 hover:bg-jungle-700 text-jungle-200 font-semibold px-5 py-2.5 rounded-lg text-sm border border-jungle-700 transition-colors">
                Schedule session
              </Link>
              <Link href="/studio" className="bg-jungle-800 hover:bg-jungle-700 text-jungle-200 font-semibold px-5 py-2.5 rounded-lg text-sm border border-jungle-700 transition-colors">
                Studio dashboard →
              </Link>
            </div>
          </div>
        )}

        {/* Purchased videos */}
        <div id="library">
          <h2 className="text-2xl font-black text-jungle-900 mb-6">
            {isCreator ? 'Videos you own' : 'Your videos'}
          </h2>

          {(purchases ?? []).length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 text-stone-400">
              <div className="text-5xl mb-4">🌿</div>
              <p className="font-medium text-stone-600">No purchased videos yet.</p>
              <Link href="/explore" className="mt-4 inline-block text-jungle-600 font-semibold hover:underline text-sm">
                Explore videos →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {purchases!.map((purchase) => {
                const video = purchase.videos as {
                  id: string; title: string; thumbnail_url: string | null;
                  duration_seconds: number | null; tags: string[]; creator_id: string
                } | null
                if (!video) return null
                const creator = profileByCreatorId[video.creator_id] ?? null
                return (
                  <Link key={purchase.id} href={`/video/${video.id}`}>
                    <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-jungle-300 transition-colors group shadow-sm">
                      <div className="aspect-video bg-stone-100 relative">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>
                        )}
                        {video.duration_seconds && (
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(video.duration_seconds)}
                          </span>
                        )}
                        <span className="absolute top-2 left-2 bg-jungle-600 text-white text-xs font-bold px-2 py-0.5 rounded-full capitalize">
                          {purchase.tier}
                        </span>
                      </div>
                      <div className="p-4">
                        {creator && (
                          <p className="text-xs text-jungle-700 font-semibold mb-1">@{creator.username}</p>
                        )}
                        <h3 className="font-bold text-stone-900 text-sm leading-snug group-hover:text-jungle-700 transition-colors">
                          {video.title}
                        </h3>
                        <p className="text-xs text-stone-400 mt-1">Paid {formatPrice(purchase.amount_paid)}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Non-creator: explore nudge */}
        {!isCreator && (
          <div className="mt-12 bg-jungle-100 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-jungle-900 mb-2">Keep exploring</h2>
            <p className="text-jungle-700 mb-4">Find movement teachers and content that gives you something to train.</p>
            <Link href="/explore" className="bg-jungle-900 hover:bg-jungle-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm inline-block transition-colors">
              Browse teachers
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="bg-white rounded-2xl p-6 border border-jungle-100 hover:border-jungle-300 transition-colors shadow-sm">
      <p className="text-xs font-semibold text-jungle-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-jungle-900">{value}</p>
    </Link>
  )
}
