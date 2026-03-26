import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApplicationsPanel } from '@/components/admin/ApplicationsPanel'
import { AdminsPanel } from '@/components/admin/AdminsPanel'
import type { SiteAdmin } from '@/components/admin/AdminsPanel'
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (createServiceSupabaseClient() as any)
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

  const { tab = 'applications' } = await searchParams

  // Always fetch pending count for the tab badge
  const { count: pendingCount } = await supabase
    .from('teacher_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let applications: any[] = []
  let siteAdmins: SiteAdmin[] = []

  if (tab === 'applications') {
    const { data } = await supabase
      .from('teacher_applications')
      .select('*, users(email), profiles(display_name, username)')
      .order('created_at', { ascending: false })
    applications = data ?? []
  } else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (createServiceSupabaseClient() as any)
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
            href="/admin?tab=admins"
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === 'admins'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Admins
          </Link>
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

        {tab === 'admins' && (
          <AdminsPanel admins={siteAdmins} />
        )}
      </div>
    </div>
  )
}
