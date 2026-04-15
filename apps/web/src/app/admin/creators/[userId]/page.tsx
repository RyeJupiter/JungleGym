import { Suspense } from 'react'
import { Navbar } from '@/components/Navbar'
import { CreatorDetailSkeleton } from '@/components/skeletons'
import { CreatorDetailContent } from './CreatorDetailContent'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Creator Details — Admin' }

export default async function CreatorDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <Suspense fallback={<CreatorDetailSkeleton />}>
        <CreatorDetailContent userId={userId} />
      </Suspense>
    </div>
  )
}
