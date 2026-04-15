import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { CheckoutSkeleton } from '@/components/skeletons'
import { CheckoutContent } from './CheckoutContent'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('videos').select('title').eq('id', id).single()
  return { title: data?.title ? `Unlock — ${data.title}` : 'Checkout' }
}

export default async function CheckoutPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="min-h-screen bg-jungle-900">
      <Navbar />
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutContent videoId={id} />
      </Suspense>
      <FooterCompact />
    </div>
  )
}
