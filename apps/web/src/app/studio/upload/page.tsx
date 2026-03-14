import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { VideoUploadForm } from '@/components/studio/VideoUploadForm'
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
      <header className="bg-white border-b border-stone-200 px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-black text-xl text-jungle-800">
          jungle<span className="text-jungle-500">gym</span>
        </Link>
        <Link href="/studio" className="text-sm text-stone-600 hover:text-stone-900 font-medium">
          ← Studio
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-stone-900 mb-2">Upload a video</h1>
        <p className="text-stone-500 mb-8">
          Every video should plant a seed — something learners can go train immediately.
        </p>
        <VideoUploadForm
          creatorId={authUser.id}
          defaultRates={{
            supported: profile?.supported_rate ?? 1,
            community: profile?.community_rate ?? 2,
            abundance: profile?.abundance_rate ?? 3,
          }}
        />
      </div>
    </div>
  )
}
