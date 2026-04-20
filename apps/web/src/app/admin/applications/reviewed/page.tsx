import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/admin'
import { Navbar } from '@/components/Navbar'
import { Skeleton } from '@/components/skeletons'
import { ReviewedApplicationsContent } from './ReviewedApplicationsContent'

export const metadata: Metadata = {
  title: 'Reviewed Applications — Admin',
  robots: { index: false, follow: false },
}

function ReviewedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
  )
}

export default async function ReviewedApplicationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin/applications/reviewed')

  let isAdmin = ADMIN_EMAILS.includes(user.email ?? '')
  if (!isAdmin) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('site_admins')
        .select('email')
        .eq('email', user.email ?? '')
        .maybeSingle()
      isAdmin = !!data
    } catch {
      // table may not exist
    }
  }
  if (!isAdmin) redirect('/library')

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <Link
          href="/admin?tab=creators"
          className="text-sm text-stone-400 hover:text-stone-600 transition-colors inline-block mb-6"
        >
          ← Back to Creators
        </Link>
        <h1 className="text-3xl font-black text-stone-900 mb-8">Reviewed applications</h1>

        <Suspense fallback={<ReviewedSkeleton />}>
          <ReviewedApplicationsContent />
        </Suspense>
      </div>
    </div>
  )
}
