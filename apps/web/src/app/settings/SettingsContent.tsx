import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { StripeConnectSection } from '@/components/studio/StripeConnectSection'
import { PricingSettingsForm } from '@/components/studio/PricingSettingsForm'
import { NotificationSettingsForm } from '@/components/studio/NotificationSettingsForm'
import { WalletSection } from '@/components/wallet/WalletSection'
import { DangerZone } from '@/components/profile/DangerZone'
import { EmailPreferences } from '@/components/profile/EmailPreferences'
import { SettingsTabs } from '@/components/settings/SettingsTabs'
import type { TabId } from '@/components/settings/SettingsTabs'

export async function SettingsContent({ userId, email }: { userId: string; email?: string }) {
  const supabase = await createServerSupabaseClient()

  const [{ data: profile }, { data: userRow }, { data: wallet }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).single(),
    supabase.from('users').select('role').eq('id', userId).single(),
    supabase.from('wallets').select('balance').eq('user_id', userId).maybeSingle(),
  ])
  const isCreator = userRow?.role === 'creator'

  const tabs: { id: TabId; label: string }[] = [
    { id: 'account', label: 'Account' },
    { id: 'payments', label: 'Payments' },
    { id: 'notifications', label: 'Notifications' },
  ]

  const tabContent: Record<TabId, React.ReactNode> = {
    account: (
      <div className="space-y-6">
        <ProfileForm profile={profile} userId={userId} email={email} isCreator={isCreator} />
        {profile?.username && (
          <DangerZone username={profile.username} userId={userId} />
        )}
      </div>
    ),

    payments: (
      <div className="space-y-6">
        <WalletSection initialBalance={wallet?.balance ?? 0} />
        {isCreator && profile && (
          <>
            <StripeConnectSection
              initialStatus={
                profile.stripe_onboarding_complete ? 'connected'
                  : profile.stripe_account_id ? 'pending'
                  : 'not_connected'
              }
            />
            <PricingSettingsForm
              userId={profile.user_id}
              supportedRate={profile.supported_rate ?? 1}
              communityRate={profile.community_rate ?? 2}
              abundanceRate={profile.abundance_rate ?? 3}
              suggestedTip={(profile as Record<string, unknown>).suggested_tip as number ?? 5}
            />
          </>
        )}
      </div>
    ),

    notifications: (
      <div className="space-y-6">
        {isCreator && profile && (
          <NotificationSettingsForm
            userId={profile.user_id}
            notificationPref={((profile as Record<string, unknown>).notification_pref as 'every' | 'daily' | 'weekly' | 'threshold' | 'off') ?? 'every'}
            notificationThreshold={(profile as Record<string, unknown>).notification_threshold as number ?? 0}
            notificationEmail={(profile as Record<string, unknown>).notification_email as string ?? null}
          />
        )}
        <EmailPreferences />
      </div>
    ),
  }

  return (
    <>
      <h1 className="text-3xl font-black text-stone-900 mb-2">Settings</h1>
      <p className="text-stone-500 mb-8">
        {profile ? `@${profile.username}` : 'Set up your public profile'}
      </p>
      <SettingsTabs tabs={tabs}>{tabContent}</SettingsTabs>
    </>
  )
}
