import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VideoUploadForm } from '@/components/studio/VideoUploadForm'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Upload video' }

export default async function UploadPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: user } = await supabase.from('users').select('role').eq('id', authUser.id).single()
  if (user?.role !== 'creator') redirect('/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('supported_rate, community_rate, abundance_rate')
    .eq('user_id', authUser.id)
    .single()

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-stone-900 mb-2">Upload a video</h1>
        <p className="text-stone-500 mb-8">
          Every video should plant a seed — something learners can go train immediately.
        </p>
        <VideoUploadForm
          creatorId={authUser.id}
          defaultRates={{
            supported: Math.max(1, profile?.supported_rate ?? 1),
            community: Math.max(1, profile?.community_rate ?? 2),
            abundance: Math.max(1, profile?.abundance_rate ?? 3),
          }}
        />
      </div>
    </div>
  )
}
