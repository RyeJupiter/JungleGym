import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApplyToTeachForm } from '@/components/apply/ApplyToTeachForm'

export async function ApplyContent() {
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
    <>
      {existing?.status === 'pending' ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-2 shadow-sm">
          <h2 className="text-xl font-bold text-stone-900">Application under review</h2>
          <p className="text-stone-500 text-sm">
            We review each application personally. We&apos;ll be in touch soon.
          </p>
        </div>
      ) : existing?.status === 'rejected' ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-2 shadow-sm">
          <h2 className="text-xl font-bold text-stone-700">Not accepted this time</h2>
          <p className="text-stone-500 text-sm">
            We weren&apos;t able to approve your application. Feel free to reach out to us directly.
          </p>
        </div>
      ) : (
        <ApplyToTeachForm userId={authUser.id} />
      )}
    </>
  )
}
