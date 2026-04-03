import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApplicationsPanel } from '@/components/admin/ApplicationsPanel'
import { AdminsPanel } from '@/components/admin/AdminsPanel'
import type { SiteAdmin } from '@/components/admin/AdminsPanel'
import { CreatorsPanel } from '@/components/admin/CreatorsPanel'
import { MetricsPanel } from '@/components/admin/MetricsPanel'
import type { MetricsData } from '@/components/admin/MetricsPanel'
import type { UserSearchResult } from '@/app/admin/actions'
import { Navbar } from '@/components/Navbar'
import { ADMIN_EMAILS } from '@/lib/admin'
import Link from 'next/link'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin' }

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  // Check hardcoded list first, then DB
  let isAdmin = ADMIN_EMAILS.includes(authUser.email ?? '')
  if (!isAdmin) {
    try {
      // cookie-based client — RLS returns a row only if caller is an admin
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('site_admins')
        .select('email')
        .eq('email', authUser.email ?? '')
        .maybeSingle()
      isAdmin = !!data
    } catch {
      // Table may not exist yet — fall through to redirect
    }
  }
  if (!isAdmin) redirect('/dashboard')

  const isSuperAdmin = ADMIN_EMAILS.includes(authUser.email ?? '')

  const { tab = 'applications' } = await searchParams

  // Always fetch pending count for the tab badge
  const { count: pendingCount } = await supabase
    .from('teacher_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let applications: any[] = []
  let siteAdmins: SiteAdmin[] = []
  let metricsData: MetricsData | null = null
  let creators: UserSearchResult[] = []

  if (tab === 'applications') {
    const { data } = await supabase
      .from('teacher_applications')
      .select('*, users(email), profiles(display_name, username)')
      .order('created_at', { ascending: false })
    applications = data ?? []
  } else if (tab === 'metrics') {
    // ── Users ──
    const { data: usersData } = await supabase.from('users').select('id, email, role')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users: any[] = usersData ?? []
    const creators = users.filter((u) => u.role === 'creator')
    const creatorIds: string[] = creators.map((u) => u.id)

    // ── Profiles (creators only) ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let profiles: any[] = []
    if (creatorIds.length > 0) {
      const { data } = await supabase.from('profiles').select('user_id, display_name, username').in('user_id', creatorIds)
      profiles = data ?? []
    }

    // ── Videos ──
    const { data: videosData } = await supabase.from('videos').select('id, creator_id, is_free, published, title')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videos: any[] = videosData ?? []
    const videoIds: string[] = videos.map((v) => v.id)

    // ── Purchases ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let purchases: any[] = []
    if (videoIds.length > 0) {
      const { data } = await supabase
        .from('purchases')
        .select('id, user_id, video_id, tier, amount_paid, platform_amount, total_amount, created_at')
        .order('created_at', { ascending: false })
      purchases = data ?? []
    }

    // ── Live sessions + gifts ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sessions: any[] = []
    if (creatorIds.length > 0) {
      const { data } = await supabase.from('live_sessions').select('id, creator_id').in('creator_id', creatorIds)
      sessions = data ?? []
    }
    const sessionIds: string[] = sessions.map((s) => s.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let gifts: any[] = []
    if (sessionIds.length > 0) {
      const { data } = await supabase.from('gifts').select('session_id, creator_amount, platform_amount')
      gifts = data ?? []
    }

    // ── Buyer profiles for recent purchases ──
    const recentPurchases = purchases.slice(0, 25)
    const buyerIds = [...new Set<string>(recentPurchases.map((p) => p.user_id))]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let buyerProfiles: any[] = []
    if (buyerIds.length > 0) {
      const { data } = await supabase.from('profiles').select('user_id, display_name').in('user_id', buyerIds)
      buyerProfiles = data ?? []
    }

    // ── Aggregate stats ──
    const publishedVideos = videos.filter((v) => v.published)
    const totalCreatorRevenue = purchases.reduce((sum, p) => sum + (p.amount_paid ?? 0), 0)
    const totalPlatformFromPurchases = purchases.reduce((sum, p) => sum + (p.platform_amount ?? 0), 0)
    const totalPlatformFromGifts = gifts.reduce((sum, g) => sum + (g.platform_amount ?? 0), 0)
    const totalGiftCreatorAmount = gifts.reduce((sum, g) => sum + (g.creator_amount ?? 0), 0)

    // ── Payout table ──
    const profileMap = new Map(profiles.map((p) => [p.user_id, p]))
    const videosByCreator = new Map<string, string[]>()
    for (const v of videos) {
      const arr = videosByCreator.get(v.creator_id) ?? []
      arr.push(v.id)
      videosByCreator.set(v.creator_id, arr)
    }
    const purchasesByVideo = new Map<string, number>()
    for (const p of purchases) {
      purchasesByVideo.set(p.video_id, (purchasesByVideo.get(p.video_id) ?? 0) + (p.amount_paid ?? 0))
    }
    const sessionsByCreator = new Map<string, string[]>()
    for (const s of sessions) {
      const arr = sessionsByCreator.get(s.creator_id) ?? []
      arr.push(s.id)
      sessionsByCreator.set(s.creator_id, arr)
    }
    const giftsBySession = new Map<string, number>()
    for (const g of gifts) {
      giftsBySession.set(g.session_id, (giftsBySession.get(g.session_id) ?? 0) + (g.creator_amount ?? 0))
    }

    const payouts = creators.map((u) => {
      const profile = profileMap.get(u.id)
      const videoEarnings = (videosByCreator.get(u.id) ?? [])
        .reduce((sum, vid) => sum + (purchasesByVideo.get(vid) ?? 0), 0)
      const giftEarnings = (sessionsByCreator.get(u.id) ?? [])
        .reduce((sum, sid) => sum + (giftsBySession.get(sid) ?? 0), 0)
      return {
        userId: u.id,
        displayName: profile?.display_name ?? u.email,
        username: profile?.username ?? '',
        email: u.email,
        videoEarnings,
        giftEarnings,
        totalOwed: videoEarnings + giftEarnings,
      }
    }).sort((a, b) => b.totalOwed - a.totalOwed)

    // ── Recent purchases list ──
    const videoMap = new Map(videos.map((v) => [v.id, v]))
    const buyerProfileMap = new Map(buyerProfiles.map((p) => [p.user_id, p]))
    const creatorProfileMap = new Map(profiles.map((p) => [p.user_id, p]))

    const recentPurchasesList = recentPurchases.map((p) => {
      const video = videoMap.get(p.video_id)
      const buyerProfile = buyerProfileMap.get(p.user_id)
      const creatorId = video?.creator_id ?? ''
      const creatorProfile = creatorProfileMap.get(creatorId)
      return {
        id: p.id,
        createdAt: p.created_at,
        tier: p.tier,
        amountPaid: p.amount_paid ?? 0,
        platformAmount: p.platform_amount ?? 0,
        totalAmount: p.total_amount ?? 0,
        buyerName: buyerProfile?.display_name ?? 'Unknown',
        buyerEmail: users.find((u) => u.id === p.user_id)?.email ?? '',
        videoTitle: video?.title ?? 'Unknown video',
        creatorName: creatorProfile?.display_name ?? 'Unknown creator',
      }
    })

    metricsData = {
      stats: {
        totalUsers: users.length,
        creators: creators.length,
        learners: users.filter((u) => u.role === 'learner').length,
        publishedVideos: publishedVideos.length,
        freeVideos: publishedVideos.filter((v) => v.is_free).length,
        paidVideos: publishedVideos.filter((v) => !v.is_free).length,
        totalPurchases: purchases.length,
        creatorRevenue: totalCreatorRevenue + totalGiftCreatorAmount,
        platformRevenue: totalPlatformFromPurchases + totalPlatformFromGifts,
        grossRevenue: purchases.reduce((sum, p) => sum + (p.total_amount ?? 0), 0)
          + gifts.reduce((sum, g) => sum + (g.creator_amount ?? 0) + (g.platform_amount ?? 0), 0),
      },
      payouts,
      recentPurchases: recentPurchasesList,
    }
  } else if (tab === 'creators') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = createServiceSupabaseClient() as any
    const { data: creatorUsers } = await svc
      .from('users').select('id, email, role').eq('role', 'creator')
    const creatorIds = ((creatorUsers ?? []) as any[]).map((u) => u.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let creatorProfiles: any[] = []
    if (creatorIds.length > 0) {
      const { data } = await svc
        .from('profiles').select('user_id, display_name, username, photo_url').in('user_id', creatorIds)
      creatorProfiles = data ?? []
    }
    const profileMap = new Map(creatorProfiles.map((p: any) => [p.user_id, p]))
    creators = ((creatorUsers ?? []) as any[]).map((u) => {
      const p = profileMap.get(u.id)
      return {
        userId: u.id,
        email: u.email ?? '',
        role: u.role ?? 'creator',
        displayName: p?.display_name ?? null,
        username: p?.username ?? null,
        photoUrl: p?.photo_url ?? null,
      }
    })
  } else if (tab === 'admins' && isSuperAdmin) {
    // Only superadmins reach this branch — RLS also enforces this at DB level
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('site_admins')
        .select('email, added_by, added_at')
        .order('added_at', { ascending: true })
      siteAdmins = data ?? []
    } catch {
      siteAdmins = []
    }
  }

  const pending = applications.filter((a) => a.status === 'pending')
  const reviewed = applications.filter((a) => a.status !== 'pending')

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black text-stone-900 mb-8">Admin</h1>

        {/* Tab nav */}
        <div className="flex gap-1 mb-10 bg-stone-100 p-1 rounded-xl w-fit">
          <Link
            href="/admin?tab=applications"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === 'applications'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Applications
            {(pendingCount ?? 0) > 0 && (
              <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full text-xs leading-none">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin?tab=creators"
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === 'creators'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Creators
          </Link>
          <Link
            href="/admin?tab=metrics"
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === 'metrics'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Metrics
          </Link>
          {isSuperAdmin && (
            <Link
              href="/admin?tab=admins"
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                tab === 'admins'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Admins
            </Link>
          )}
        </div>

        {tab === 'applications' && (
          <>
            <section className="mb-12">
              <h2 className="text-lg font-bold text-stone-900 mb-4">
                Pending <span className="text-stone-400 font-normal">({pending.length})</span>
              </h2>
              <ApplicationsPanel applications={pending} />
            </section>

            {reviewed.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-stone-400 mb-4">
                  Reviewed <span className="font-normal">({reviewed.length})</span>
                </h2>
                <ApplicationsPanel applications={reviewed} />
              </section>
            )}
          </>
        )}

        {tab === 'creators' && (
          <CreatorsPanel initialCreators={creators} />
        )}

        {tab === 'metrics' && metricsData && (
          <MetricsPanel data={metricsData} />
        )}

        {tab === 'admins' && isSuperAdmin && (
          <AdminsPanel admins={siteAdmins} superadminEmails={ADMIN_EMAILS} />
        )}
      </div>
    </div>
  )
}
