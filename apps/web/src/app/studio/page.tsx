import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PurchaseToast } from '@/components/studio/PurchaseToast'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { StudioSessionsSkeleton, StudioVideosSkeleton } from '@/components/skeletons'
import { StudioSessions, StudioVideos } from './StudioContent'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Studio' }

export default async function StudioPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: profile }] = await Promise.all([
    supabase.from('users').select('role').eq('id', authUser.id).single(),
    supabase.from('profiles').select('notification_pref, notification_threshold').eq('user_id', authUser.id).single(),
  ])
  if (user?.role !== 'creator') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-stone-50">
      <PurchaseToast
        creatorId={authUser.id}
        notificationPref={(profile?.notification_pref ?? 'every') as 'every' | 'daily' | 'weekly' | 'threshold' | 'off'}
        notificationThreshold={profile?.notification_threshold ?? 0}
      />
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900">Studio</h1>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href="/studio/upload"
              className="flex-1 sm:flex-none text-center bg-jungle-600 hover:bg-jungle-700 text-white font-semibold px-4 sm:px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              + Upload video
            </Link>
            <Link
              href="/studio/sessions/new"
              className="flex-1 sm:flex-none text-center bg-white hover:bg-stone-50 text-stone-800 font-semibold px-4 sm:px-5 py-2.5 rounded-lg text-sm border border-stone-200 transition-colors"
            >
              + Schedule session
            </Link>
            <Link
              href="/settings"
              className="flex-1 sm:flex-none text-center bg-white hover:bg-stone-50 text-stone-500 font-semibold px-4 sm:px-5 py-2.5 rounded-lg text-sm border border-stone-200 transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Live sessions */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-stone-900 mb-4">Live sessions</h2>
          <Suspense fallback={<StudioSessionsSkeleton count={2} />}>
            <StudioSessions userId={authUser.id} />
          </Suspense>
        </section>

        {/* Videos */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-stone-900 mb-4">Your videos</h2>
          <Suspense fallback={<StudioVideosSkeleton count={3} />}>
            <StudioVideos userId={authUser.id} />
          </Suspense>
        </section>
      </div>
      <FooterCompact />
    </div>
  )
}
