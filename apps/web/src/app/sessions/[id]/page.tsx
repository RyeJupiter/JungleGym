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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('live_sessions')
    .select('title, description, scheduled_at')
    .eq('id', id)
    .maybeSingle()

  if (!data) return { title: 'Session' }

  const description =
    (data.description as string | null)?.slice(0, 160) ??
    'A live movement session on JungleGym. Gift-based — join us live.'

  return {
    title: data.title as string,
    description,
    alternates: { canonical: `/sessions/${id}` },
    openGraph: {
      type: 'article',
      title: data.title as string,
      description,
      url: `/sessions/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title as string,
      description,
    },
  }
}

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session } = await (supabase as any)
    .from('live_sessions')
    .select('title, description, scheduled_at, duration_minutes, status, creator_id')
    .eq('id', id)
    .maybeSingle()

  let creatorName: string | null = null
  if (session?.creator_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('display_name, username')
      .eq('user_id', session.creator_id)
      .maybeSingle()
    creatorName = profile?.display_name ?? profile?.username ?? null
  }

  const jsonLd = session
    ? {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: session.title,
        description: session.description ?? undefined,
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        eventStatus:
          session.status === 'cancelled'
            ? 'https://schema.org/EventCancelled'
            : 'https://schema.org/EventScheduled',
        startDate: session.scheduled_at,
        endDate: new Date(
          new Date(session.scheduled_at).getTime() + (session.duration_minutes ?? 0) * 60000
        ).toISOString(),
        location: {
          '@type': 'VirtualLocation',
          url: `https://junglegym.academy/sessions/${id}`,
        },
        organizer: creatorName
          ? { '@type': 'Person', name: creatorName }
          : { '@type': 'Organization', name: 'JungleGym' },
      }
    : null

  return (
    <div className="min-h-screen bg-stone-50">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Navbar />
      <Suspense fallback={<SessionDetailSkeleton />}>
        <SessionContent sessionId={id} />
      </Suspense>
      <FooterCompact />
    </div>
  )
}
