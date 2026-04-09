import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ApplyToTeachForm } from '@/components/apply/ApplyToTeachForm'
import { FooterCompact } from '@/components/FooterCompact'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Apply to Teach' }

export default async function ApplyPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/auth/login')

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (user?.role === 'creator') redirect('/studio')

  const { data: existing } = await supabase
    .from('teacher_applications')
    .select('status')
    .eq('user_id', authUser.id)
    .single()

  return (
    <main className="min-h-screen bg-jungle-900 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <a href="/" className="font-black text-2xl text-white">
            jungle<span className="text-jungle-400">gym</span>
          </a>
          <h1 className="text-3xl font-black text-white mt-6">Become a teacher</h1>
          <p className="text-jungle-400 mt-2">
            We curate every creator on the network. Tell us about your practice.
          </p>
        </div>

        {existing?.status === 'pending' ? (
          <div className="bg-jungle-800 border border-jungle-700 rounded-2xl p-8 text-center space-y-2">
            <h2 className="text-xl font-bold text-white">Application under review</h2>
            <p className="text-jungle-400 text-sm">
              We review each application personally. We'll be in touch soon.
            </p>
          </div>
        ) : existing?.status === 'rejected' ? (
          <div className="bg-jungle-800 border border-jungle-700 rounded-2xl p-8 text-center space-y-2">
            <h2 className="text-xl font-bold text-jungle-300">Not accepted this time</h2>
            <p className="text-jungle-500 text-sm">
              We weren't able to approve your application. Feel free to reach out to us directly.
            </p>
          </div>
        ) : (
          <ApplyToTeachForm userId={authUser.id} />
        )}
      </div>
      <FooterCompact />
    </main>
  )
}
