import { createServiceSupabaseClient } from '@/lib/supabase/server'
import type { AdminApplication } from '@/components/admin/ApplicationCard'

type FetchOptions = {
  /**
   * 'pending' for the Creators tab list.
   * 'reviewed' for the dedicated reviewed-applications page.
   * 'all' if a caller ever needs every row.
   */
  status: 'pending' | 'reviewed' | 'all'
}

/**
 * Loads teacher applications for admin surfaces. Does three fan-outs:
 *  - the raw teacher_applications rows
 *  - applicant users + profiles
 *  - reviewer profiles (for reviewed apps)
 * Then generates 1-hour signed URLs for every demo_video_url.
 */
export async function fetchAdminApplications({ status }: FetchOptions): Promise<AdminApplication[]> {
  const svc = await createServiceSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (svc as any)
    .from('teacher_applications')
    .select(
      'id, user_id, motivation, instagram_url, youtube_url, movement_types, other_movement, demo_video_url, status, created_at, reviewed_at, reviewed_by',
    )
    .order('created_at', { ascending: false })

  if (status === 'pending') query = query.eq('status', 'pending')
  if (status === 'reviewed') query = query.neq('status', 'pending')

  const { data: rawApps } = await query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apps: any[] = rawApps ?? []
  if (apps.length === 0) return []

  const applicantIds = [...new Set(apps.map((a) => a.user_id))] as string[]
  const reviewerIds = [...new Set(apps.map((a) => a.reviewed_by).filter(Boolean))] as string[]
  const profileIds = [...new Set([...applicantIds, ...reviewerIds])]

  const [{ data: usersData }, { data: profilesData }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('users').select('id, email').in('id', profileIds),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('profiles').select('user_id, display_name, username, photo_url').in('user_id', profileIds),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMap = new Map<string, any>(((usersData ?? []) as any[]).map((u) => [u.id, u]))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileMap = new Map<string, any>(((profilesData ?? []) as any[]).map((p) => [p.user_id, p]))

  // Generate signed URLs for every demo in one pass
  const demoPaths = apps.map((a) => a.demo_video_url).filter(Boolean) as string[]
  const signedUrlByPath = new Map<string, string>()
  if (demoPaths.length > 0) {
    const { data: signed } = await svc.storage
      .from('teacher-applications')
      .createSignedUrls(demoPaths, 3600)
    for (const entry of signed ?? []) {
      if (entry.path && entry.signedUrl) signedUrlByPath.set(entry.path, entry.signedUrl)
    }
  }

  return apps.map((a) => {
    const u = userMap.get(a.user_id)
    const p = profileMap.get(a.user_id)
    const reviewerProfile = a.reviewed_by ? profileMap.get(a.reviewed_by) : null
    const reviewerUser = a.reviewed_by ? userMap.get(a.reviewed_by) : null

    return {
      id: a.id,
      user_id: a.user_id,
      motivation: a.motivation,
      instagram_url: a.instagram_url,
      youtube_url: a.youtube_url,
      movement_types: a.movement_types ?? [],
      other_movement: a.other_movement,
      demoVideoSignedUrl: a.demo_video_url ? signedUrlByPath.get(a.demo_video_url) ?? null : null,
      status: a.status,
      created_at: a.created_at,
      reviewed_at: a.reviewed_at,
      applicant: {
        display_name: p?.display_name ?? null,
        username: p?.username ?? null,
        email: u?.email ?? null,
        photo_url: p?.photo_url ?? null,
      },
      reviewer: a.reviewed_by
        ? {
            display_name: reviewerProfile?.display_name ?? reviewerUser?.email ?? null,
            email: reviewerUser?.email ?? null,
          }
        : null,
    } satisfies AdminApplication
  })
}

export async function countReviewedApplications(): Promise<number> {
  const svc = await createServiceSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (svc as any)
    .from('teacher_applications')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'pending')
  return count ?? 0
}
