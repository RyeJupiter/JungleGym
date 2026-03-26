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
