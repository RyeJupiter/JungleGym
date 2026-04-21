import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { AdminsPanel } from '@/components/admin/AdminsPanel'
import type { SiteAdmin } from '@/components/admin/AdminsPanel'
import { CreatorsPanel } from '@/components/admin/CreatorsPanel'
import { MetricsPanel } from '@/components/admin/MetricsPanel'
import type { MetricsData } from '@/components/admin/MetricsPanel'
import { OverridesPanel } from '@/components/admin/OverridesPanel'
import { IssuesPanel } from '@/components/admin/IssuesPanel'
import type { TranscriptIssue } from '@/components/admin/IssuesPanel'
import { RecentlyDeletedPanel } from '@/components/admin/RecentlyDeletedPanel'
import type { DeletedVideo } from '@/components/admin/RecentlyDeletedPanel'
import type { UserSearchResult } from '@/app/admin/actions'
import type { AdminApplication } from '@/components/admin/ApplicationCard'
import { fetchAdminApplications, countReviewedApplications } from '@/lib/admin-applications'
import { ADMIN_EMAILS, ADMIN_PREVIEW_COOKIE } from '@/lib/admin'
import Link from 'next/link'

export async function AdminContent({
  authEmail,
  tab,
}: {
  authEmail: string
  tab: string
}) {
  const supabase = await createServerSupabaseClient()
  const isSuperAdmin = ADMIN_EMAILS.includes(authEmail)

  // Always fetch pending count for the creators tab badge.
  // Service role bypasses RLS so the admin sees the platform-wide count,
  // not just their own (if any) application.
  const svcPending = await createServiceSupabaseClient()
  const { count: pendingCount } = await svcPending
    .from('teacher_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Issues tab badge: failed transcriptions + pending ones stuck for >10min.
  // Always fetched so the tab count stays accurate on any page load.
  const stuckCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: failedCount } = await (svcPending as any)
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .or(`transcript_status.eq.failed,and(transcript_status.eq.pending,video_url.not.is.null,created_at.lt.${stuckCutoff})`)
  const issuesCount = failedCount ?? 0

  let pendingApplications: AdminApplication[] = []
  let reviewedCount = 0
  let siteAdmins: SiteAdmin[] = []
  let metricsData: MetricsData | null = null
  let creators: UserSearchResult[] = []
  let issues: TranscriptIssue[] = []
  let deletedVideos: DeletedVideo[] = []

  if (tab === 'creators') {
    const svc = await createServiceSupabaseClient()
    ;[pendingApplications, reviewedCount] = await Promise.all([
      fetchAdminApplications({ status: 'pending' }),
      countReviewedApplications(),
    ])

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
  } else if (tab === 'metrics') {
    const svcMetrics = await createServiceSupabaseClient()
    const { data: usersData } = await svcMetrics.from('users').select('id, email, role')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users: any[] = usersData ?? []
    const creatorsList = users.filter((u) => u.role === 'creator')
    const creatorIds: string[] = creatorsList.map((u) => u.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let profiles: any[] = []
    if (creatorIds.length > 0) {
      const { data } = await svcMetrics.from('profiles').select('user_id, display_name, username').in('user_id', creatorIds)
      profiles = data ?? []
    }

    const { data: videosData } = await svcMetrics.from('videos').select('id, creator_id, is_free, published, title')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videos: any[] = videosData ?? []
    const videoIds: string[] = videos.map((v) => v.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let purchases: any[] = []
    if (videoIds.length > 0) {
      const { data } = await svcMetrics
        .from('purchases')
        .select('id, user_id, video_id, tier, amount_paid, platform_amount, total_amount, created_at')
        .order('created_at', { ascending: false })
      purchases = data ?? []
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sessions: any[] = []
    if (creatorIds.length > 0) {
      const { data } = await svcMetrics.from('live_sessions').select('id, creator_id, title').in('creator_id', creatorIds)
      sessions = data ?? []
    }
    const sessionIds: string[] = sessions.map((s) => s.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let gifts: any[] = []
    if (sessionIds.length > 0) {
      const { data } = await svcMetrics
        .from('gifts')
        .select('id, session_id, giver_id, creator_amount, platform_amount, total_amount, message, created_at')
        .order('created_at', { ascending: false })
      gifts = data ?? []
    }

    const buyerIds = [...new Set<string>(purchases.map((p) => p.user_id))]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let buyerProfiles: any[] = []
    if (buyerIds.length > 0) {
      const { data } = await svcMetrics.from('profiles').select('user_id, display_name').in('user_id', buyerIds)
      buyerProfiles = data ?? []
    }

    const giverIds = [...new Set<string>(gifts.map((g) => g.giver_id))]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let giverProfiles: any[] = []
    if (giverIds.length > 0) {
      const { data } = await svcMetrics.from('profiles').select('user_id, display_name').in('user_id', giverIds)
      giverProfiles = data ?? []
    }

    const publishedVideos = videos.filter((v) => v.published)

    const profileMap = new Map(profiles.map((p) => [p.user_id, p]))
    const videoMap = new Map(videos.map((v) => [v.id, v]))
    const buyerProfileMap = new Map(buyerProfiles.map((p) => [p.user_id, p]))
    const creatorProfileMap = new Map(profiles.map((p) => [p.user_id, p]))
    const giverProfileMap = new Map(giverProfiles.map((p) => [p.user_id, p]))
    const sessionMap = new Map(sessions.map((s) => [s.id, s]))

    const creatorRoster = creatorsList.map((u) => {
      const profile = profileMap.get(u.id)
      return {
        userId: u.id,
        displayName: profile?.display_name ?? u.email,
        username: profile?.username ?? '',
        email: u.email,
      }
    })

    const purchaseTransactions = purchases.map((p) => {
      const video = videoMap.get(p.video_id)
      const buyerProfile = buyerProfileMap.get(p.user_id)
      const creatorProfile = creatorProfileMap.get(video?.creator_id ?? '')
      return {
        id: p.id,
        type: 'purchase' as const,
        createdAt: p.created_at,
        amount: p.amount_paid ?? 0,
        platformAmount: p.platform_amount ?? 0,
        totalAmount: p.total_amount ?? 0,
        tier: p.tier,
        videoTitle: video?.title ?? 'Unknown video',
        buyerName: buyerProfile?.display_name ?? 'Unknown',
        buyerEmail: users.find((u) => u.id === p.user_id)?.email ?? '',
        creatorName: creatorProfile?.display_name ?? 'Unknown creator',
        creatorUserId: video?.creator_id ?? '',
      }
    })

    const giftTransactions = gifts.map((g) => {
      const session = sessionMap.get(g.session_id)
      const creatorProfile = creatorProfileMap.get(session?.creator_id ?? '')
      const giverProfile = giverProfileMap.get(g.giver_id)
      return {
        id: g.id,
        type: 'gift' as const,
        createdAt: g.created_at,
        amount: g.creator_amount ?? 0,
        platformAmount: g.platform_amount ?? 0,
        totalAmount: g.total_amount ?? 0,
        giverName: giverProfile?.display_name ?? 'Unknown',
        giverEmail: users.find((u: any) => u.id === g.giver_id)?.email ?? '',
        sessionTitle: session?.title ?? 'Unknown session',
        message: g.message ?? undefined,
        creatorName: creatorProfile?.display_name ?? 'Unknown creator',
        creatorUserId: session?.creator_id ?? '',
      }
    })

    const allTransactions = [...purchaseTransactions, ...giftTransactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    metricsData = {
      stats: {
        totalUsers: users.length,
        creators: creatorsList.length,
        learners: users.filter((u) => u.role === 'learner').length,
        publishedVideos: publishedVideos.length,
        freeVideos: publishedVideos.filter((v) => v.is_free).length,
        paidVideos: publishedVideos.filter((v) => !v.is_free).length,
      },
      creators: creatorRoster,
      allTransactions,
    }
  } else if (tab === 'issues') {
    const svc = await createServiceSupabaseClient()
    // Failed transcriptions OR pending ones stuck >10min (initial extract
    // probably failed, we never got to call /api/transcribe).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: issueRows } = await (svc as any)
      .from('videos')
      .select('id, title, creator_id, transcript_status, transcript_error, transcript_attempts, updated_at, created_at, video_url')
      .or(`transcript_status.eq.failed,and(transcript_status.eq.pending,video_url.not.is.null,created_at.lt.${stuckCutoff})`)
      .order('updated_at', { ascending: false })
      .limit(50)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const issueCreatorIds = [...new Set<string>(((issueRows ?? []) as any[]).map((v) => v.creator_id))]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let issueProfiles: any[] = []
    if (issueCreatorIds.length > 0) {
      const { data } = await svc
        .from('profiles').select('user_id, display_name, username').in('user_id', issueCreatorIds)
      issueProfiles = data ?? []
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const issueProfileMap = new Map(issueProfiles.map((p: any) => [p.user_id, p]))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    issues = ((issueRows ?? []) as any[]).map((v) => {
      const p = issueProfileMap.get(v.creator_id)
      return {
        videoId: v.id,
        title: v.title,
        creatorName: p?.display_name ?? null,
        creatorUsername: p?.username ?? null,
        status: v.transcript_status === 'failed' ? 'failed' : 'stuck',
        error: v.transcript_error ?? null,
        attempts: v.transcript_attempts ?? 0,
        updatedAt: v.updated_at,
      } as TranscriptIssue
    })

    // Recently deleted videos (within the 30-day restore window).
    const deleteWindowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deletedRows } = await (svc as any)
      .from('videos')
      .select('id, title, creator_id, deleted_at')
      .not('deleted_at', 'is', null)
      .gt('deleted_at', deleteWindowStart)
      .order('deleted_at', { ascending: false })
      .limit(100)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deletedCreatorIds = [...new Set<string>(((deletedRows ?? []) as any[]).map((v) => v.creator_id))]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let deletedProfiles: any[] = []
    if (deletedCreatorIds.length > 0) {
      const { data } = await svc
        .from('profiles').select('user_id, display_name, username').in('user_id', deletedCreatorIds)
      deletedProfiles = data ?? []
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deletedProfileMap = new Map(deletedProfiles.map((p: any) => [p.user_id, p]))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deletedVideos = ((deletedRows ?? []) as any[]).map((v) => {
      const p = deletedProfileMap.get(v.creator_id)
      const deletedMs = new Date(v.deleted_at).getTime()
      const msSince = Date.now() - deletedMs
      const daysRemaining = Math.max(0, 30 - Math.floor(msSince / (24 * 60 * 60 * 1000)))
      return {
        videoId: v.id,
        title: v.title,
        creatorName: p?.display_name ?? null,
        creatorUsername: p?.username ?? null,
        deletedAt: v.deleted_at,
        daysRemaining,
      } as DeletedVideo
    })
  } else if (tab === 'admins' && isSuperAdmin) {
    try {
      const svc = await createServiceSupabaseClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (svc as any)
        .from('site_admins')
        .select('email, added_by, added_at')
        .order('added_at', { ascending: true })
      siteAdmins = data ?? []
    } catch {
      siteAdmins = []
    }
  }

  return (
    <>
      <h1 className="text-4xl font-black text-stone-900 mb-8">Admin</h1>

      {/* Tab nav */}
      <div className="flex gap-1 mb-10 bg-stone-100 p-1 rounded-xl w-fit">
        <Link
          href="/admin?tab=creators"
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            tab === 'creators'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Creators
          {(pendingCount ?? 0) > 0 && (
            <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full text-xs leading-none">
              {pendingCount}
            </span>
          )}
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
        <Link
          href="/admin?tab=overrides"
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            tab === 'overrides'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Overrides
        </Link>
        <Link
          href="/admin?tab=issues"
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            tab === 'issues'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Issues
          {issuesCount > 0 && (
            <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-xs leading-none">
              {issuesCount}
            </span>
          )}
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

      {tab === 'creators' && (
        <>
          {/* Quick links */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
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

          <CreatorsPanel
            initialCreators={creators}
            pendingApplications={pendingApplications}
            reviewedCount={reviewedCount}
          />
        </>
      )}

      {tab === 'metrics' && metricsData && (
        <MetricsPanel data={metricsData} />
      )}

      {tab === 'overrides' && (
        <OverridesPanel previewModeOn={(await cookies()).get(ADMIN_PREVIEW_COOKIE)?.value === '1'} />
      )}

      {tab === 'issues' && (
        <>
          <IssuesPanel issues={issues} />
          <RecentlyDeletedPanel videos={deletedVideos} />
        </>
      )}

      {tab === 'admins' && isSuperAdmin && (
        <AdminsPanel admins={siteAdmins} superadminEmails={ADMIN_EMAILS} />
      )}
    </>
  )
}
