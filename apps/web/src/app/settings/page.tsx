import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { SettingsFormSkeleton } from '@/components/skeletons'
import { SettingsContent } from './SettingsContent'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <Suspense fallback={<SettingsFormSkeleton />}>
          <SettingsContent userId={authUser.id} email={authUser.email} />
        </Suspense>
      </div>
      <FooterCompact />
    </div>
  )
}
