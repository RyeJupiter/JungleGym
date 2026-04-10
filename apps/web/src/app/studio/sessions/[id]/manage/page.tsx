import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { SessionManagePage } from '@/components/studio/SessionManagePage'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manage Session' }

export default async function SessionManageRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: session } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('id', id)
    .eq('creator_id', authUser.id)
    .single()

  if (!session) notFound()

  // Fetch gifts for this session
  const { data: gifts } = await supabase
    .from('gifts')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: false })

  // Two-step: get giver profiles
  const giverIds = [...new Set((gifts ?? []).map((g) => g.giver_id))]
  const { data: giverProfiles } = giverIds.length
    ? await supabase.from('profiles').select('user_id, display_name, username').in('user_id', giverIds)
    : { data: [] }
  const profileByGiverId = Object.fromEntries((giverProfiles ?? []).map((p) => [p.user_id, p]))

  const transactions = (gifts ?? []).map((g) => ({
    id: g.id,
    createdAt: g.created_at,
    giverName: profileByGiverId[g.giver_id]?.display_name ?? 'Anonymous',
    giverUsername: profileByGiverId[g.giver_id]?.username ?? '',
    message: g.message ?? null,
    creatorAmount: Number(g.creator_amount),
    platformAmount: Number(g.platform_amount),
    total: Number(g.total_amount),
  }))

  const totalGifts = transactions.reduce((sum, t) => sum + t.total, 0)
  const totalCreator = transactions.reduce((sum, t) => sum + t.creatorAmount, 0)

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <SessionManagePage
        session={{
          id: session.id,
          creator_id: session.creator_id,
          title: session.title,
          description: session.description ?? null,
          scheduled_at: session.scheduled_at,
          duration_minutes: session.duration_minutes,
          status: session.status,
          max_participants: session.max_participants ?? null,
          cf_input_id: (session as Record<string, unknown>).cf_input_id as string | null ?? null,
          cf_stream_key: (session as Record<string, unknown>).cf_stream_key as string | null ?? null,
        }}
        metrics={{ giftCount: transactions.length, totalGifts, totalCreator }}
        transactions={transactions}
      />
    </div>
  )
}
