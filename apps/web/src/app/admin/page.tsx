import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ADMIN_EMAILS } from '@/lib/admin'
import { AdminSkeleton } from '@/components/skeletons'
import { AdminContent } from './AdminContent'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin' }

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/auth/login')

    // Check hardcoded list first, then DB
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
        // Table may not exist yet — fall through to redirect
      }
    }
    if (!isAdmin) redirect('/library')

    const { tab = 'creators' } = await searchParams

    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />

        <div className="max-w-3xl mx-auto px-6 py-12">
          <Suspense fallback={<AdminSkeleton />}>
            <AdminContent authEmail={authUser.email ?? ''} tab={tab} />
          </Suspense>
        </div>
      </div>
    )
  } catch (err) {
    console.error('Admin page error:', err)
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-xl w-full space-y-4">
          <h1 className="text-lg font-bold text-red-700">Something went wrong</h1>
          <p className="text-sm text-stone-600">
            {err instanceof Error ? err.message : 'An unexpected error occurred.'}
          </p>
        </div>
      </div>
    )
  }
}
