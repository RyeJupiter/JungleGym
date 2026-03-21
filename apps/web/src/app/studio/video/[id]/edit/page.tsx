import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { VideoEditForm } from '@/components/studio/VideoEditForm'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Edit Video' }

export default async function VideoEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: video } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .eq('creator_id', session.user.id)
    .single()

  if (!video) notFound()

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-stone-900 mb-8">Edit video</h1>
        <VideoEditForm video={video} />
      </div>
    </div>
  )
}
