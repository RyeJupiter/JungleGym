import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { StudioSettingsForm } from '@/components/studio/StudioSettingsForm'
import { StripeConnectSection } from '@/components/studio/StripeConnectSection'
import { DangerZone } from '@/components/profile/DangerZone'
import { EmailPreferences } from '@/components/profile/EmailPreferences'

export async function SettingsContent({ userId, email }: { userId: string; email?: string }) {
  const supabase = await createServerSupabaseClient()

  const [{ data: profile }, { data: userRow }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).single(),
    supabase.from('users').select('role').eq('id', userId).single(),
  ])
  const isCreator = userRow?.role === 'creator'

  return (
    <>
      <h1 className="text-3xl font-black text-stone-900 mb-2">Settings</h1>
      <p className="text-stone-500 mb-8">
        {profile ? `@${profile.username}` : 'Set up your public profile'}
      </p>
      <ProfileForm profile={profile} userId={userId} email={email} isCreator={isCreator} />

      {isCreator && profile && (
        <div className="mt-6 space-y-6">
          <StripeConnectSection
            initialStatus={
              profile.stripe_onboarding_complete ? 'connected'
                : profile.stripe_account_id ? 'pending'
                : 'not_connected'
            }
          />
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
            notification_pref: ((profile as Record<string, unknown>).notification_pref as 'every' | 'daily' | 'weekly' | 'threshold' | 'off') ?? 'every',
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
          <DangerZone username={profile.username} userId={userId} />
        </div>
      )}
    </>
  )
}
