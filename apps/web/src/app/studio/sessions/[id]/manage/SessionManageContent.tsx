import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SessionManagePage } from '@/components/studio/SessionManagePage'
import { getWhipUrl } from '@/lib/cloudflare-stream'

export async function SessionManageContent({ sessionId }: { sessionId: string }) {
  const supabase = await createServerSupabaseClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: session } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('creator_id', authUser.id)
    .single()

  if (!session) notFound()

  // Fetch gifts for this session
  const { data: gifts } = await supabase
    .from('gifts')
    .select('*')
    .eq('session_id', sessionId)
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

  const cfInputId = (session as Record<string, unknown>).cf_input_id as string | null ?? null
  const whipUrl = cfInputId ? getWhipUrl(cfInputId) : null

  return (
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
        cf_input_id: cfInputId,
        cf_stream_key: (session as Record<string, unknown>).cf_stream_key as string | null ?? null,
      }}
      whipUrl={whipUrl}
      metrics={{ giftCount: transactions.length, totalGifts, totalCreator }}
      transactions={transactions}
    />
  )
}
