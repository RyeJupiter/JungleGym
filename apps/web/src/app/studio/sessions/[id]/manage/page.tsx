import { Suspense } from 'react'
import { Navbar } from '@/components/Navbar'
import { SessionManageSkeleton } from '@/components/skeletons'
import { SessionManageContent } from './SessionManageContent'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manage Session' }

export default async function SessionManageRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <Suspense fallback={<SessionManageSkeleton />}>
        <SessionManageContent sessionId={id} />
      </Suspense>
    </div>
  )
}
