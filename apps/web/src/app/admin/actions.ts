'use server'

import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

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

    const supabase = await createServerSupabaseClient()

    // Search profiles (name/username) and users (email) in parallel
    const [{ data: profileMatches }, { data: emailMatches }] = await Promise.all([
      supabase.from('profiles')
        .select('user_id, display_name, username, photo_url')
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(8),
      supabase.from('users')
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
      supabase.from('users').select('id, email, role').in('id', allIds),
      supabase.from('profiles').select('user_id, display_name, username, photo_url').in('user_id', allIds),
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
    const supabase = await createServerSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
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
