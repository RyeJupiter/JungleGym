import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { resolveConfig } from '@/components/treehouse/config'
import { TreehouseShell } from './TreehouseShell'
import type { Metadata } from 'next'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = await createServerSupabaseClient()
  const { data: metaProfile } = await supabase
    .from('profiles')
    .select('display_name, tagline')
    .eq('username', username)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mp = metaProfile as any
  if (!mp) return { title: `@${username}` }
  return {
    title: `${mp.display_name} (@${username}) — JungleGym`,
    description: mp.tagline ?? undefined,
  }
}

export default async function TreehousePage({ params }: Props) {
  const { username } = await params
  const supabase = await createServerSupabaseClient()

  // Step 1: fetch profile
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profileRaw) notFound()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRaw as any

  // Step 2: parallel queries (no FK join filters per architecture rules)
  const [{ data: videos }, { data: sessions }, { data: { user: authUser } }] =
    await Promise.all([
      supabase
        .from('videos')
        .select('id, title, description, thumbnail_url, duration_seconds, is_free, price_supported, price_community, price_abundance, tags, view_count, created_at')
        .eq('creator_id', profile.user_id)
        .eq('published', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('live_sessions')
        .select('id, title, description, scheduled_at, duration_minutes, status, max_participants')
        .eq('creator_id', profile.user_id)
        .in('status', ['scheduled', 'live'])
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(4),
      supabase.auth.getUser(),
    ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allVideos: any[] = videos ?? []
  const freeVideos = allVideos.filter((v) => v.is_free)
  const paidVideos = allVideos.filter((v) => !v.is_free)
  const upcomingSessions = sessions ?? []
  const isOwnProfile = authUser?.id === profile.user_id

  const config = resolveConfig(profile.treehouse_config)

  const data = {
    profile: {
      user_id: profile.user_id,
      display_name: profile.display_name,
      username: profile.username,
      photo_url: profile.photo_url,
      tagline: profile.tagline,
      bio: profile.bio,
      location: profile.location,
      tags: profile.tags,
      supported_rate: Number(profile.supported_rate),
      community_rate: Number(profile.community_rate),
      abundance_rate: Number(profile.abundance_rate),
    },
    freeVideos,
    paidVideos,
    allVideos,
    sessions: upcomingSessions,
    isOwnProfile,
  }

  return (
    <div>
      <Navbar />
      <TreehouseShell config={config} data={data} />
    </div>
  )
}
