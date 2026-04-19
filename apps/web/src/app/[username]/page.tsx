import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { TreehouseSkeleton } from '@/components/skeletons'
import { TreehouseContent } from './TreehouseContent'
import type { Metadata } from 'next'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaProfile } = await (supabase as any)
    .from('profiles')
    .select('display_name, tagline, bio, photo_url, tags, location')
    .eq('username', username)
    .maybeSingle()

  if (!metaProfile) return { title: `@${username}` }

  const displayName = metaProfile.display_name as string
  const tagline = metaProfile.tagline as string | null
  const bio = metaProfile.bio as string | null
  const photo = metaProfile.photo_url as string | null
  const tags = (metaProfile.tags as string[] | null) ?? []
  const location = metaProfile.location as string | null

  const description =
    tagline ??
    bio?.slice(0, 160) ??
    `${displayName} teaches ${tags.length > 0 ? tags.slice(0, 3).join(', ') : 'movement'} on JungleGym${location ? ` from ${location}` : ''}. Watch their classes and join live sessions.`

  return {
    title: `${displayName} (@${username})`,
    description,
    keywords: tags.length > 0 ? tags : undefined,
    alternates: { canonical: `/@${username}` },
    openGraph: {
      type: 'profile',
      title: `${displayName} on JungleGym`,
      description,
      url: `/@${username}`,
      images: photo ? [{ url: photo }] : undefined,
    },
    twitter: {
      card: photo ? 'summary_large_image' : 'summary',
      title: `${displayName} on JungleGym`,
      description,
      images: photo ? [photo] : undefined,
    },
  }
}

export default async function TreehousePage({ params }: Props) {
  const { username } = await params
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('display_name, bio, photo_url, tags, instagram_url, website_url')
    .eq('username', username)
    .maybeSingle()

  const sameAs: string[] = []
  if (profile?.instagram_url) {
    const handle = String(profile.instagram_url)
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
      .replace(/^@/, '')
      .replace(/\/$/, '')
    if (handle) sameAs.push(`https://instagram.com/${handle}`)
  }
  if (profile?.website_url) sameAs.push(String(profile.website_url))

  const jsonLd = profile
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.display_name,
        url: `https://junglegym.academy/@${username}`,
        image: profile.photo_url ?? undefined,
        description: profile.bio ?? undefined,
        knowsAbout: (profile.tags as string[] | null) ?? undefined,
        sameAs: sameAs.length > 0 ? sameAs : undefined,
      }
    : null

  return (
    <div>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Navbar />
      <Suspense fallback={<TreehouseSkeleton />}>
        <TreehouseContent username={username} />
      </Suspense>
    </div>
  )
}
