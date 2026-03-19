import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StudioSettingsForm } from '@/components/studio/StudioSettingsForm'
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

  if (!profile) redirect('/studio')

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-black text-xl text-jungle-800">
          jungle<span className="text-jungle-500">gym</span>
        </Link>
        <Link href="/studio" className="text-sm text-stone-600 hover:text-stone-900 font-medium">
          ← Studio
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-stone-900 mb-8">Creator settings</h1>
        <StudioSettingsForm profile={profile} />
      </div>
    </div>
  )
}
