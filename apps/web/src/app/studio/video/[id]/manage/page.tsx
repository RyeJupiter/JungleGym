import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { VideoManagePage } from '@/components/studio/VideoManagePage'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Manage Video' }

export default async function VideoManagePageRoute({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: video } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (!video) notFound()

  // Fetch purchase metrics
  const { data: purchases } = await supabase
    .from('purchases')
    .select('amount_paid')
    .eq('video_id', id)

  const purchaseCount = purchases?.length ?? 0
  const creatorEarnings = purchases?.reduce((sum, p) => sum + (p.amount_paid ?? 0), 0) ?? 0

  // Construct public video URL for the thumbnail picker
  let videoPublicUrl: string | null = null
  if (video.video_url) {
    const { data } = supabase.storage.from('videos').getPublicUrl(video.video_url)
    videoPublicUrl = data.publicUrl
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <VideoManagePage
        video={video}
        videoPublicUrl={videoPublicUrl}
        metrics={{ purchaseCount, creatorEarnings }}
      />
    </div>
  )
}
