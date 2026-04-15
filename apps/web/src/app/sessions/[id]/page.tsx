import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { SessionDetailSkeleton } from '@/components/skeletons'
import { SessionContent } from './SessionContent'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('live_sessions').select('title').eq('id', id).single()
  return { title: data?.title ?? 'Session' }
}

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <Suspense fallback={<SessionDetailSkeleton />}>
        <SessionContent sessionId={id} />
      </Suspense>
      <FooterCompact />
    </div>
  )
}
