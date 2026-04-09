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

  // Fetch full purchase rows for the transactions table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: purchaseRows } = await supabase
    .from('purchases')
    .select('id, created_at, tier, amount_paid, platform_tip_pct, user_id')
    .eq('video_id', id)
    .order('created_at', { ascending: false }) as { data: Array<{
      id: string
      created_at: string
      tier: string
      amount_paid: number
      platform_tip_pct: number
      user_id: string
    }> | null }

  // Two-step join for buyer profiles (FK joins unreliable in Supabase client)
  const buyerIds = [...new Set((purchaseRows ?? []).map((p) => p.user_id))]
  const { data: buyerProfiles } = buyerIds.length
    ? await supabase
        .from('profiles')
        .select('user_id, display_name, username')
        .in('user_id', buyerIds)
    : { data: [] as Array<{ user_id: string; display_name: string; username: string }> }

  const profileMap = Object.fromEntries(
    (buyerProfiles ?? []).map((p) => [p.user_id, p])
  )

  const transactions = (purchaseRows ?? []).map((p) => {
    const feePct = (p.platform_tip_pct ?? 20) / 100
    const creatorPct = 1 - feePct
    const total = creatorPct > 0 ? p.amount_paid / creatorPct : p.amount_paid
    const platformAmount = total - p.amount_paid
    const buyer = profileMap[p.user_id]
    return {
      id: p.id,
      createdAt: p.created_at,
      tier: p.tier as string,
      buyerName: buyer?.display_name ?? 'Unknown',
      buyerUsername: buyer?.username ?? '',
      creatorAmount: p.amount_paid,
      platformAmount,
      total,
    }
  })

  const purchaseCount = transactions.length
  const creatorEarnings = transactions.reduce((sum, t) => sum + t.creatorAmount, 0)

  // Generate a signed URL for the thumbnail picker (videos bucket is private)
  let videoPublicUrl: string | null = null
  if (video.video_url) {
    const { data } = await supabase.storage
      .from('videos')
      .createSignedUrl(video.video_url, 3600)
    videoPublicUrl = data?.signedUrl ?? null
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <VideoManagePage
        video={video}
        videoPublicUrl={videoPublicUrl}
        metrics={{ purchaseCount, creatorEarnings }}
        transactions={transactions}
      />
    </div>
  )
}
