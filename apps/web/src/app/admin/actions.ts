'use server'

import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

async function assertCallerIsAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) throw new Error('Not authenticated')
  if (ADMIN_EMAILS.includes(user.email)) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (createServiceSupabaseClient() as any)
    .from('site_admins')
    .select('email')
    .eq('email', user.email)
    .maybeSingle()
  if (!data) throw new Error('Not authorized')
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

// ── User search ──────────────────────────────────────────────────────────────

export async function searchUsers(query: string): Promise<{ results: UserSearchResult[]; error?: string }> {
  try {
    await assertCallerIsAdmin()
    const q = query.trim()
    if (!q) return { results: [] }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = createServiceSupabaseClient() as any

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

    // Collect unique user IDs from both searches
    const allIds = [
      ...new Set([
        ...((profileMatches ?? []) as any[]).map((p) => p.user_id),
        ...((emailMatches ?? []) as any[]).map((u) => u.id),
      ]),
    ]
    if (allIds.length === 0) return { results: [] }

    // Fetch complete data for all matched IDs (two-step — FK joins unreliable)
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

// ── Creator role management ──────────────────────────────────────────────────

export async function setCreatorRole(userId: string, isCreator: boolean): Promise<{ error?: string }> {
  try {
    await assertCallerIsAdmin()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (createServiceSupabaseClient() as any)
      .from('users')
      .update({ role: isCreator ? 'creator' : 'learner' })
      .eq('id', userId)
    if (error) return { error: error.message }
    revalidatePath('/admin')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update role' }
  }
}

export async function addSiteAdmin(email: string): Promise<{ error?: string }> {
  try {
    await assertCallerIsAdmin()
    const normalized = email.toLowerCase().trim()
    if (!normalized) return { error: 'Email is required' }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (createServiceSupabaseClient() as any)
      .from('site_admins')
      .insert({ email: normalized, added_by: user?.email ?? null })

    if (error) return { error: error.message }
    revalidatePath('/admin')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to add admin' }
  }
}

export async function removeSiteAdmin(email: string): Promise<{ error?: string }> {
  try {
    await assertCallerIsAdmin()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (createServiceSupabaseClient() as any)
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
