import { Suspense } from 'react'
import { Navbar } from '@/components/Navbar'
import { VideoManageSkeleton } from '@/components/skeletons'
import { VideoManageContent } from './VideoManageContent'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Manage Video' }

export default async function VideoManagePageRoute({ params }: Props) {
  const { id } = await params

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <Suspense fallback={<VideoManageSkeleton />}>
        <VideoManageContent videoId={id} />
      </Suspense>
    </div>
  )
}
