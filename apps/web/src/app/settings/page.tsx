import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { StudioSettingsForm } from '@/components/studio/StudioSettingsForm'
import { DangerZone } from '@/components/profile/DangerZone'
import { EmailPreferences } from '@/components/profile/EmailPreferences'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
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
        <h1 className="text-3xl font-black text-stone-900 mb-2">Settings</h1>
        <p className="text-stone-500 mb-8">
          {profile ? `@${profile.username}` : 'Set up your public profile'}
        </p>
        <ProfileForm profile={profile} userId={authUser.id} email={authUser.email} isCreator={isCreator} />

        {isCreator && profile && (
          <div className="mt-6">
            <StudioSettingsForm profile={{
              user_id: profile.user_id,
              display_name: profile.display_name ?? '',
              username: profile.username,
              bio: profile.bio ?? null,
              tagline: profile.tagline ?? null,
              location: profile.location ?? null,
              tags: profile.tags ?? [],
              photo_url: profile.photo_url ?? null,
              supported_rate: profile.supported_rate ?? 1,
              community_rate: profile.community_rate ?? 2,
              abundance_rate: profile.abundance_rate ?? 3,
              suggested_tip: (profile as Record<string, unknown>).suggested_tip as number ?? 5,
              notification_pref: (profile as Record<string, unknown>).notification_pref as string ?? 'every',
              notification_threshold: (profile as Record<string, unknown>).notification_threshold as number ?? 0,
              notification_email: (profile as Record<string, unknown>).notification_email as string ?? null,
            }} />
          </div>
        )}

        <div className="mt-6">
          <EmailPreferences />
        </div>

        {profile?.username && (
          <div className="mt-6">
            <DangerZone username={profile.username} userId={authUser.id} />
          </div>
        )}
      </div>
      <FooterCompact />
    </div>
  )
}
