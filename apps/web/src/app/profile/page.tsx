import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProfileForm } from '@/components/profile/ProfileForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Profile' }

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-black text-xl text-jungle-800">
          jungle<span className="text-jungle-500">gym</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-stone-600 hover:text-stone-900 font-medium">
          ← Dashboard
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-stone-900 mb-2">Edit profile</h1>
        <p className="text-stone-500 mb-8">
          {profile ? `@${profile.username}` : 'Set up your public profile'}
        </p>
        <ProfileForm profile={profile} userId={session.user.id} />
      </div>
    </div>
  )
}
