import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Profile' }

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: profile }, { data: userRow }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', authUser.id).single(),
    supabase.from('users').select('role').eq('id', authUser.id).single(),
  ])
  const isCreator = userRow?.role === 'creator'

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-stone-900 mb-2">Edit profile</h1>
        <p className="text-stone-500 mb-8">
          {profile ? `@${profile.username}` : 'Set up your public profile'}
        </p>
        <ProfileForm profile={profile} userId={authUser.id} isCreator={isCreator} />
      </div>
    </div>
  )
}
