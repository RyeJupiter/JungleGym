import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApplicationsPanel } from '@/components/admin/ApplicationsPanel'
import { Navbar } from '@/components/Navbar'
import { ADMIN_EMAILS } from '@/lib/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin' }

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')
  if (!ADMIN_EMAILS.includes(authUser.email ?? '')) redirect('/dashboard')

  const { data: applications } = await supabase
    .from('teacher_applications')
    .select('*, users(email), profiles(display_name, username)')
    .order('created_at', { ascending: false })

  const pending = (applications ?? []).filter((a) => a.status === 'pending')
  const reviewed = (applications ?? []).filter((a) => a.status !== 'pending')

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black text-stone-900 mb-2">Teacher applications</h1>
        <p className="text-stone-500 mb-10">Approve to grant creator access. They can start uploading immediately.</p>

        <section className="mb-12">
          <h2 className="text-lg font-bold text-stone-900 mb-4">
            Pending <span className="text-stone-400 font-normal">({pending.length})</span>
          </h2>
          <ApplicationsPanel applications={pending} />
        </section>

        {reviewed.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-stone-400 mb-4">
              Reviewed <span className="font-normal">({reviewed.length})</span>
            </h2>
            <ApplicationsPanel applications={reviewed} />
          </section>
        )}
      </div>
    </div>
  )
}
