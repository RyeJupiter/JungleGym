import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { VideoDetailSkeleton } from '@/components/skeletons'
import { VideoContent } from './VideoContent'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('videos').select('title').eq('id', id).single()
  return { title: data?.title ?? 'Video' }
}

export default async function VideoPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <Suspense fallback={<VideoDetailSkeleton />}>
        <VideoContent videoId={id} />
      </Suspense>
      <FooterCompact />
    </div>
  )
}
