import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ADMIN_EMAILS } from '@/lib/admin'
import Link from 'next/link'

function fmt(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-stone-900">{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </div>
  )
}

export async function CreatorDetailContent({ userId }: { userId: string }) {
  // ── Admin auth guard ──
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  let isAdmin = ADMIN_EMAILS.includes(authUser.email ?? '')
  if (!isAdmin) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('site_admins')
        .select('email')
        .eq('email', authUser.email ?? '')
        .maybeSingle()
      isAdmin = !!data
    } catch {
      // Table may not exist yet
    }
  }
  if (!isAdmin) redirect('/library')

  // ── Fetch creator data ──
  const svc = await createServiceSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData } = await svc
    .from('users')
    .select('id, email, role')
    .eq('id', userId)
    .single()
  const user = userData as any
  if (!user || user.role !== 'creator') notFound()

  const [
    { data: profileData },
    { data: videosData },
    { data: sessionsData },
  ] = await Promise.all([
    svc.from('profiles').select('*').eq('user_id', userId).single(),
    svc.from('videos').select('id, title, is_free, published, duration_seconds, view_count, created_at').eq('creator_id', userId).order('created_at', { ascending: false }),
    svc.from('live_sessions').select('id, title, creator_id').eq('creator_id', userId),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileData as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videos: any[] = videosData ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions: any[] = sessionsData ?? []
  const videoIds = videos.map((v: any) => v.id)
  const sessionIds = sessions.map((s: any) => s.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let purchases: any[] = []
  if (videoIds.length > 0) {
    const { data } = await svc
      .from('purchases')
      .select('id, video_id, amount_paid, platform_amount, tier, created_at')
      .in('video_id', videoIds)
    purchases = data ?? []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let gifts: any[] = []
  if (sessionIds.length > 0) {
    const { data } = await svc
      .from('gifts')
      .select('id, session_id, creator_amount, platform_amount')
      .in('session_id', sessionIds)
    gifts = data ?? []
  }

  const purchasesByVideo = new Map<string, { count: number; earnings: number }>()
  for (const p of purchases) {
    const entry = purchasesByVideo.get(p.video_id) ?? { count: 0, earnings: 0 }
    entry.count += 1
    entry.earnings += p.amount_paid ?? 0
    purchasesByVideo.set(p.video_id, entry)
  }

  const videoEarnings = videos.map((v: any) => {
    const stats = purchasesByVideo.get(v.id) ?? { count: 0, earnings: 0 }
    return { ...v, purchaseCount: stats.count, earnings: stats.earnings }
  }).sort((a: any, b: any) => b.earnings - a.earnings)

  const totalVideoEarnings = purchases.reduce((sum, p) => sum + (p.amount_paid ?? 0), 0)
  const totalGiftEarnings = gifts.reduce((sum, g) => sum + (g.creator_amount ?? 0), 0)
  const totalOwed = totalVideoEarnings + totalGiftEarnings

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/admin?tab=metrics"
        className="text-sm text-stone-400 hover:text-stone-600 transition-colors mb-6 inline-block"
      >
        &larr; Back to Metrics
      </Link>

      {/* ── Profile Header ── */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8">
        <div className="flex items-start gap-5">
          {profile?.photo_url ? (
            <img
              src={profile.photo_url}
              alt={profile.display_name}
              className="w-20 h-20 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl text-stone-400">
                {(profile?.display_name ?? '?')[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-stone-900">{profile?.display_name ?? 'Unknown'}</h1>
            <p className="text-sm text-stone-400">
              {profile?.username && <>@{profile.username} · </>}
              {user.email}
            </p>
            {profile?.tagline && (
              <p className="text-sm text-stone-600 mt-1">{profile.tagline}</p>
            )}
            {profile?.bio && (
              <p className="text-sm text-stone-500 mt-2">{profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {profile?.location && (
                <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                  {profile.location}
                </span>
              )}
              {(profile?.tags ?? []).map((tag: string) => (
                <span key={tag} className="text-xs bg-jungle-50 text-jungle-700 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Earnings Summary ── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="Video sales" value={fmt(totalVideoEarnings)} sub={`${purchases.length} purchase${purchases.length !== 1 ? 's' : ''}`} />
        <StatCard label="Gifts" value={fmt(totalGiftEarnings)} sub={`${gifts.length} gift${gifts.length !== 1 ? 's' : ''}`} />
        <StatCard label="Total owed" value={fmt(totalOwed)} />
      </div>

      {/* ── Videos Table ── */}
      <section>
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">Videos</h2>
        {videoEarnings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
            <p className="font-medium">No videos yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-100">
                <tr className="text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider">Video</th>
                  <th className="px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Purchases</th>
                  <th className="px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Earnings</th>
                  <th className="px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {videoEarnings.map((v) => (
                  <tr key={v.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-900">{v.title}</p>
                      {v.duration_seconds && (
                        <p className="text-xs text-stone-400 mt-0.5">
                          {Math.floor(v.duration_seconds / 60)}:{String(v.duration_seconds % 60).padStart(2, '0')} · {v.view_count} views
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-stone-700">{v.purchaseCount}</td>
                    <td className="px-5 py-4 text-right font-bold text-stone-900">
                      {v.is_free ? 'Free' : fmt(v.earnings)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        v.published
                          ? 'bg-green-50 text-green-600'
                          : 'bg-stone-100 text-stone-500'
                      }`}>
                        {v.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
