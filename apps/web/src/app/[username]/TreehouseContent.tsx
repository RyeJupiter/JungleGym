import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { resolveConfig } from '@/components/treehouse/config'
import type { ViewerRole } from '@/components/treehouse/sections/SectionRenderer'
import { TreehouseShell } from './TreehouseShell'

export async function TreehouseContent({ username }: { username: string }) {
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
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('live_sessions')
        .select('id, title, description, scheduled_at, duration_minutes, status, max_participants')
        .eq('creator_id', profile.user_id)
        .in('status', ['live', 'scheduled'])
        .order('scheduled_at', { ascending: true })
        .limit(10),
      supabase.auth.getUser(),
    ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allVideos: any[] = videos ?? []
  const freeVideos = allVideos.filter((v) => v.is_free)
  const paidVideos = allVideos.filter((v) => !v.is_free)
  const now = Date.now()
  const upcomingSessions = (sessions ?? []).filter((s: any) => {
    if (s.status === 'live') return true
    const endTime = new Date(s.scheduled_at).getTime() + s.duration_minutes * 60 * 1000
    return endTime > now
  }).slice(0, 4)
  const isOwnProfile = authUser?.id === profile.user_id

  // Viewer role gates heavy editor features (intro video, large gallery).
  // Only queried when we'll actually use it — viewing someone else's treehouse
  // doesn't need it, and an anonymous viewer can't edit anything.
  let viewerRole: ViewerRole = null
  if (isOwnProfile && authUser) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRow } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .maybeSingle()
    viewerRole = (userRow?.role as ViewerRole) ?? 'learner'
  }

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
      instagram_url: profile.instagram_url ?? null,
      website_url: profile.website_url ?? null,
    },
    freeVideos,
    paidVideos,
    allVideos,
    sessions: upcomingSessions,
    isOwnProfile,
    viewerRole,
    streamCustomerCode: process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE ?? null,
  }

  return <TreehouseShell config={config} data={data} />
}
