'use server'

import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS, ADMIN_PREVIEW_COOKIE } from '@/lib/admin'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

// ── Auth helpers ─────────────────────────────────────────────────────────────

// Any admin (superadmin or regular admin)
async function assertCallerIsAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) throw new Error('Not authenticated')
  if (ADMIN_EMAILS.includes(user.email)) return  // superadmin fast-path

  // RLS returns only the caller's own row — non-admins get null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('site_admins')
    .select('email')
    .eq('email', user.email)
    .maybeSingle()
  if (!data) throw new Error('Not authorized')
}

// Superadmins only (hardcoded list) — required for managing site_admins
async function assertCallerIsSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) throw new Error('Not authenticated')
  if (!ADMIN_EMAILS.includes(user.email)) throw new Error('Not authorized — superadmin required')
}

// ── Shared type ──────────────────────────────────────────────────────────────

export type UserSearchResult = {
  userId: string
  email: string
  role: string
  displayName: string | null
  username: string | null
  photoUrl: string | null
}

// ── User search (any admin) ───────────────────────────────────────────────────

export async function searchUsers(query: string): Promise<{ results: UserSearchResult[]; error?: string }> {
  try {
    await assertCallerIsAdmin()
    const q = query.trim()
    if (!q) return { results: [] }

    // Service role bypasses RLS — needed because users table is "own record only"
    const svc = await createServiceSupabaseClient()

    // Search profiles (name/username) and users (email) in parallel
    const [{ data: profileMatches }, { data: emailMatches }] = await Promise.all([
      svc.from('profiles')
        .select('user_id, display_name, username, photo_url')
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(8),
      svc.from('users')
        .select('id, email, role')
        .ilike('email', `%${q}%`)
        .limit(8),
    ])

    // Collect unique user IDs (two-step — FK joins unreliable per CLAUDE.md)
    const allIds = [
      ...new Set([
        ...((profileMatches ?? []) as any[]).map((p) => p.user_id),
        ...((emailMatches ?? []) as any[]).map((u) => u.id),
      ]),
    ]
    if (allIds.length === 0) return { results: [] }

    const [{ data: users }, { data: profiles }] = await Promise.all([
      svc.from('users').select('id, email, role').in('id', allIds),
      svc.from('profiles').select('user_id, display_name, username, photo_url').in('user_id', allIds),
    ])

    const profileMap = new Map(((profiles ?? []) as any[]).map((p) => [p.user_id, p]))

    const results: UserSearchResult[] = ((users ?? []) as any[]).map((u) => {
      const p = profileMap.get(u.id)
      return {
        userId: u.id,
        email: u.email ?? '',
        role: u.role ?? 'learner',
        displayName: p?.display_name ?? null,
        username: p?.username ?? null,
        photoUrl: p?.photo_url ?? null,
      }
    })

    return { results }
  } catch (err) {
    return { results: [], error: err instanceof Error ? err.message : 'Search failed' }
  }
}

// ── Creator role management (any admin) ──────────────────────────────────────

export async function setCreatorRole(userId: string, isCreator: boolean): Promise<{ error?: string }> {
  try {
    await assertCallerIsAdmin()
    // Service role bypasses RLS — needed because users table is "own record only"
    const svc = await createServiceSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (svc as any)
      .from('users')
      .update({ role: isCreator ? 'creator' : 'learner' })
      .eq('id', userId)
    if (error) return { error: error.message }

    // Sync profiles.supported_rate so guides page stays in sync
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (svc as any)
      .from('profiles')
      .update(
        isCreator
          ? { supported_rate: 15, community_rate: 25, abundance_rate: 35 }
          : { supported_rate: null, community_rate: null, abundance_rate: null }
      )
      .eq('user_id', userId)

    revalidatePath('/admin')
    revalidatePath('/guides')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update role' }
  }
}

// ── Admin management (superadmin only) ───────────────────────────────────────

export async function addSiteAdmin(email: string): Promise<{ error?: string }> {
  try {
    await assertCallerIsSuperAdmin()
    const normalized = email.toLowerCase().trim()
    if (!normalized) return { error: 'Email is required' }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const svc = await createServiceSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (svc as any)
      .from('site_admins')
      .insert({ email: normalized, added_by: user?.email ?? null })

    if (error) return { error: error.message }
    revalidatePath('/admin')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to add admin' }
  }
}

export async function approveApplication(appId: string, userId: string): Promise<{ error?: string }> {
  try {
    await assertCallerIsAdmin()
    const supabase = await createServerSupabaseClient()
    const { data: { user: reviewer } } = await supabase.auth.getUser()
    const svc = await createServiceSupabaseClient()

    // Grant creator role + set default rates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: roleErr } = await (svc as any)
      .from('users').update({ role: 'creator' }).eq('id', userId)
    if (roleErr) return { error: roleErr.message }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (svc as any)
      .from('profiles')
      .update({ supported_rate: 15, community_rate: 25, abundance_rate: 35 })
      .eq('user_id', userId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: appErr } = await (svc as any)
      .from('teacher_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer?.id ?? null,
      })
      .eq('id', appId)
    if (appErr) return { error: appErr.message }

    revalidatePath('/admin')
    revalidatePath('/admin/applications/reviewed')
    revalidatePath('/guides')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to approve application' }
  }
}

export async function rejectApplication(appId: string): Promise<{ error?: string }> {
  try {
    await assertCallerIsAdmin()
    const supabase = await createServerSupabaseClient()
    const { data: { user: reviewer } } = await supabase.auth.getUser()
    const svc = await createServiceSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (svc as any)
      .from('teacher_applications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer?.id ?? null,
      })
      .eq('id', appId)
    if (error) return { error: error.message }
    revalidatePath('/admin')
    revalidatePath('/admin/applications/reviewed')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to reject application' }
  }
}

// ── Admin overrides (any admin) ──────────────────────────────────────────────
// All writes here go through the service role. RLS was locked down in
// migration 00024 (no direct user INSERT on purchases), so *only* admin
// server-actions like these can create purchase rows outside the normal
// Stripe flow. Audit trail lives on the purchase row itself via
// `stripe_payment_intent_id = 'ADMIN_GRANT:<admin_user_id>'` — same
// convention as existing DISPUTED:/REFUNDED: prefixes.

const ADMIN_GRANT_PREFIX = 'ADMIN_GRANT:'

export type AdminVideoSearchResult = {
  videoId: string
  title: string
  isFree: boolean
  published: boolean
  creatorDisplayName: string | null
  creatorUsername: string | null
}

export async function searchVideosForAdmin(
  query: string,
): Promise<{ results: AdminVideoSearchResult[]; error?: string }> {
  try {
    await assertCallerIsAdmin()
    const q = query.trim()
    if (!q) return { results: [] }

    const svc = await createServiceSupabaseClient()

    // Match by title OR by creator username (two-step join, per CLAUDE.md
    // rule — no `!` FK join syntax).
    const [{ data: titleMatches }, { data: creatorProfiles }] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (svc as any)
        .from('videos')
        .select('id, title, is_free, published, creator_id')
        .ilike('title', `%${q}%`)
        .order('created_at', { ascending: false })
        .limit(15),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (svc as any)
        .from('profiles')
        .select('user_id, display_name, username')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(10),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let creatorVideos: any[] = []
    const creatorIds = ((creatorProfiles ?? []) as any[]).map((p) => p.user_id)
    if (creatorIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (svc as any)
        .from('videos')
        .select('id, title, is_free, published, creator_id')
        .in('creator_id', creatorIds)
        .order('created_at', { ascending: false })
        .limit(20)
      creatorVideos = data ?? []
    }

    // Dedupe by video id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videoMap = new Map<string, any>()
    ;((titleMatches ?? []) as any[]).forEach((v) => videoMap.set(v.id, v))
    creatorVideos.forEach((v) => videoMap.set(v.id, v))
    const videos = Array.from(videoMap.values())

    if (videos.length === 0) return { results: [] }

    // Fetch creator profiles for all matching videos
    const allCreatorIds = [...new Set(videos.map((v) => v.creator_id))]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profiles } = await (svc as any)
      .from('profiles')
      .select('user_id, display_name, username')
      .in('user_id', allCreatorIds)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileMap = new Map<string, any>(((profiles ?? []) as any[]).map((p) => [p.user_id, p]))

    const results: AdminVideoSearchResult[] = videos.slice(0, 20).map((v) => {
      const p = profileMap.get(v.creator_id)
      return {
        videoId: v.id,
        title: v.title,
        isFree: !!v.is_free,
        published: !!v.published,
        creatorDisplayName: p?.display_name ?? null,
        creatorUsername: p?.username ?? null,
      }
    })

    return { results }
  } catch (err) {
    return { results: [], error: err instanceof Error ? err.message : 'Search failed' }
  }
}

export type VideoAccessEntry = {
  purchaseId: string
  userId: string
  userEmail: string
  userDisplayName: string | null
  userUsername: string | null
  tier: string
  amountPaid: number
  kind: 'paid' | 'share' | 'admin_grant'
  adminGranterUserId: string | null
  createdAt: string
  expiresAt: string | null
}

export async function getVideoAccessList(
  videoId: string,
): Promise<{ entries: VideoAccessEntry[]; error?: string }> {
  try {
    await assertCallerIsAdmin()
    const svc = await createServiceSupabaseClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (svc as any)
      .from('purchases')
      .select('id, user_id, tier, amount_paid, stripe_payment_intent_id, expires_at, created_at')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })

    const purchases = (rows ?? []) as any[]
    if (purchases.length === 0) return { entries: [] }

    const userIds = [...new Set<string>(purchases.map((p) => p.user_id))]

    const [{ data: users }, { data: profiles }] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (svc as any).from('users').select('id, email').in('id', userIds),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (svc as any).from('profiles').select('user_id, display_name, username').in('user_id', userIds),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailMap = new Map<string, string>(((users ?? []) as any[]).map((u) => [u.id, u.email ?? '']))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileMap = new Map<string, any>(((profiles ?? []) as any[]).map((p) => [p.user_id, p]))

    const entries: VideoAccessEntry[] = purchases.map((p) => {
      const piId = (p.stripe_payment_intent_id as string | null) ?? ''
      const isAdminGrant = piId.startsWith(ADMIN_GRANT_PREFIX)
      const isShare = !!p.expires_at
      const kind: VideoAccessEntry['kind'] = isAdminGrant ? 'admin_grant' : isShare ? 'share' : 'paid'
      const profile = profileMap.get(p.user_id)
      return {
        purchaseId: p.id,
        userId: p.user_id,
        userEmail: emailMap.get(p.user_id) ?? '',
        userDisplayName: profile?.display_name ?? null,
        userUsername: profile?.username ?? null,
        tier: p.tier,
        amountPaid: Number(p.amount_paid ?? 0),
        kind,
        adminGranterUserId: isAdminGrant ? piId.slice(ADMIN_GRANT_PREFIX.length) : null,
        createdAt: p.created_at,
        expiresAt: p.expires_at,
      }
    })

    return { entries }
  } catch (err) {
    return { entries: [], error: err instanceof Error ? err.message : 'Fetch failed' }
  }
}

export async function adminGrantVideoAccess(
  userId: string,
  videoId: string,
): Promise<{ error?: string }> {
  try {
    await assertCallerIsAdmin()
    if (!userId || !videoId) return { error: 'userId and videoId required' }

    const supabase = await createServerSupabaseClient()
    const { data: { user: admin } } = await supabase.auth.getUser()
    if (!admin) return { error: 'Not authenticated' }

    const svc = await createServiceSupabaseClient()

    // Verify video + target user exist. We don't ever want to accidentally
    // create an orphan purchase row for a non-existent user/video.
    const [{ data: video }, { data: targetUser }] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (svc as any).from('videos').select('id').eq('id', videoId).maybeSingle(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (svc as any).from('users').select('id').eq('id', userId).maybeSingle(),
    ])
    if (!video) return { error: 'Video not found' }
    if (!targetUser) return { error: 'User not found' }

    // Upsert a $0 purchase row. ON CONFLICT (user_id, video_id) means if the
    // user already has *any* purchase row (paid, share, or admin grant) we
    // replace expires_at with NULL (permanent) and stamp the admin audit
    // trail. For real paid rows this would overwrite the stripe_payment_intent_id
    // which is undesirable — so we skip if there's a real paid row.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (svc as any)
      .from('purchases')
      .select('id, stripe_payment_intent_id, expires_at')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .maybeSingle()

    if (existing && !existing.expires_at) {
      const pi = (existing.stripe_payment_intent_id as string | null) ?? ''
      if (pi.startsWith('pi_') || pi.startsWith('cs_')) {
        return { error: 'User already has a paid purchase; no grant needed' }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (svc as any)
      .from('purchases')
      .upsert(
        {
          user_id: userId,
          video_id: videoId,
          tier: 'supported',
          amount_paid: 0,
          platform_tip_pct: 0,
          platform_amount: 0,
          total_amount: 0,
          stripe_payment_intent_id: `${ADMIN_GRANT_PREFIX}${admin.id}`,
          expires_at: null,
        },
        { onConflict: 'user_id,video_id' },
      )

    if (error) return { error: error.message }

    revalidatePath('/admin')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to grant access' }
  }
}

export async function adminRevokeVideoAccess(
  userId: string,
  videoId: string,
): Promise<{ error?: string }> {
  try {
    await assertCallerIsAdmin()
    if (!userId || !videoId) return { error: 'userId and videoId required' }

    const svc = await createServiceSupabaseClient()

    // Only delete admin-granted rows. Paid rows (stripe_payment_intent_id
    // starts with pi_/cs_) and share redemptions (expires_at IS NOT NULL)
    // must remain — real refunds go through Stripe, share revocations through
    // the shares table. This guard is defense in depth against an admin
    // misclicking "revoke" on a legitimate paid row.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (svc as any)
      .from('purchases')
      .select('id, stripe_payment_intent_id, expires_at')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .maybeSingle()

    if (!existing) return { error: 'No access record found' }

    const pi = (existing.stripe_payment_intent_id as string | null) ?? ''
    if (!pi.startsWith(ADMIN_GRANT_PREFIX)) {
      return {
        error:
          'Cannot revoke — this is a paid purchase or share redemption. Use Stripe refund or share management instead.',
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (svc as any)
      .from('purchases')
      .delete()
      .eq('id', existing.id)

    if (error) return { error: error.message }

    revalidatePath('/admin')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to revoke access' }
  }
}

export async function toggleAdminPreviewMode(
  enabled: boolean,
): Promise<{ error?: string }> {
  try {
    await assertCallerIsAdmin()
    const cookieStore = await cookies()
    if (enabled) {
      cookieStore.set(ADMIN_PREVIEW_COOKIE, '1', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours — short-lived on purpose
      })
    } else {
      cookieStore.delete(ADMIN_PREVIEW_COOKIE)
    }
    revalidatePath('/admin')
    revalidatePath('/video', 'layout')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to toggle preview mode' }
  }
}

// ────────────────────────────────────────────────────────────────────────────

export async function removeSiteAdmin(email: string): Promise<{ error?: string }> {
  try {
    await assertCallerIsSuperAdmin()

    const svc = await createServiceSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (svc as any)
      .from('site_admins')
      .delete()
      .eq('email', email)

    if (error) return { error: error.message }
    revalidatePath('/admin')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to remove admin' }
  }
}

// ── Dismiss issues from the admin Issues panel (any admin) ───────────────────

/** Hide a transcript-failure / stuck-pending row from the Issues panel. */
export async function dismissTranscriptIssue(videoId: string): Promise<{ error?: string }> {
  try {
    await assertCallerIsAdmin()
    if (!videoId) return { error: 'videoId required' }

    const svc = await createServiceSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (svc as any)
      .from('videos')
      .update({ transcript_issue_dismissed_at: new Date().toISOString() })
      .eq('id', videoId)

    if (error) return { error: error.message }
    revalidatePath('/admin')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to dismiss' }
  }
}

/** Mark an admin_issues row as dismissed, stamped with the caller's email. */
export async function dismissAdminIssue(issueId: string): Promise<{ error?: string }> {
  try {
    await assertCallerIsAdmin()
    if (!issueId) return { error: 'issueId required' }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const email = user?.email ?? null

    const svc = await createServiceSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (svc as any)
      .from('admin_issues')
      .update({
        dismissed_at: new Date().toISOString(),
        dismissed_by: email,
      })
      .eq('id', issueId)

    if (error) return { error: error.message }
    revalidatePath('/admin')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to dismiss' }
  }
}

// ── Restore a soft-deleted video (any admin) ─────────────────────────────────

export async function restoreDeletedVideo(videoId: string): Promise<{ error?: string }> {
  try {
    await assertCallerIsAdmin()
    if (!videoId) return { error: 'videoId required' }

    // Service client bypasses the "creator update" RLS policy — creators
    // own their videos, admins don't. Clearing deleted_at brings it back
    // into studio view for the creator; we leave published=false so they
    // can review before republishing.
    const svc = await createServiceSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (svc as any)
      .from('videos')
      .update({ deleted_at: null })
      .eq('id', videoId)

    if (error) return { error: error.message }
    revalidatePath('/admin')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to restore video' }
  }
}
