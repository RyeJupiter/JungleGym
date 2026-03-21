import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudioSettingsForm } from '@/components/studio/StudioSettingsForm'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Studio Settings' }

export default async function StudioSettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: user } = await supabase
    .from('users').select('role').eq('id', authUser.id).single()
  if (user?.role !== 'creator') redirect('/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', authUser.id)
    .single()

  if (!profile) redirect('/profile')

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-stone-900 mb-8">Creator settings</h1>
        <StudioSettingsForm profile={profile} />
      </div>
    </div>
  )
}
