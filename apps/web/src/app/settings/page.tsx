import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: profile }, { data: userRow }] = await Promise.all([
    supabase.from('profiles').select('user_id, username, display_name').eq('user_id', authUser.id).single(),
    supabase.from('users').select('role').eq('id', authUser.id).single(),
  ])
  const isCreator = userRow?.role === 'creator'

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-stone-900 mb-2">Settings</h1>
        <p className="text-stone-500 mb-8">Manage your account, security, and preferences.</p>
        <ProfileForm
          profile={profile ?? null}
          userId={authUser.id}
          email={authUser.email}
          isCreator={isCreator}
        />
      </div>
    </div>
  )
}
