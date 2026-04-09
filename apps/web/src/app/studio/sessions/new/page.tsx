import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ScheduleSessionForm } from '@/components/studio/ScheduleSessionForm'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Schedule Session' }

export default async function NewSessionPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: user } = await supabase
    .from('users').select('role').eq('id', authUser.id).single()
  if (user?.role !== 'creator') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-stone-900 mb-2">Schedule a session</h1>
        <p className="text-stone-500 mb-8">Gift-based. 100% of gifts go directly to you.</p>
        <ScheduleSessionForm creatorId={session.user.id} />
      </div>
    </div>
  )
}
