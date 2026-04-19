import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const BASE = 'https://junglegym.academy'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,         changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/classes`,  changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/explore`,  changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/sessions`, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/guides`,   changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/why`,      changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/festivals`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`,  changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${BASE}/policies`, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  try {
    const supabase = await createServerSupabaseClient()

    const [{ data: videos }, { data: profiles }, { data: sessions }] = await Promise.all([
      supabase.from('videos').select('id, updated_at').eq('published', true),
      supabase.from('profiles').select('username, updated_at').not('username', 'is', null),
      supabase.from('live_sessions').select('id, updated_at').in('status', ['scheduled', 'live']),
    ])

    const videoRoutes: MetadataRoute.Sitemap = (videos ?? []).map((v) => ({
      url: `${BASE}/video/${v.id}`,
      lastModified: v.updated_at ? new Date(v.updated_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const profileRoutes: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
      url: `${BASE}/@${p.username}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const sessionRoutes: MetadataRoute.Sitemap = (sessions ?? []).map((s) => ({
      url: `${BASE}/sessions/${s.id}`,
      lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
      changeFrequency: 'daily',
      priority: 0.5,
    }))

    return [...staticRoutes, ...videoRoutes, ...profileRoutes, ...sessionRoutes]
  } catch {
    return staticRoutes
  }
}
