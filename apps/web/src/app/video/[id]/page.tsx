import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { VideoDetailSkeleton } from '@/components/skeletons'
import { VideoContent } from './VideoContent'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('videos')
    .select('title, description, thumbnail_url, tags')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!data) return { title: 'Video' }

  const title = data.title as string
  const rawDesc = (data.description as string | null) ?? ''
  const tags = (data.tags as string[] | null) ?? []
  // If the creator hasn't written a description (or it's thin), derive one
  // from the title + tags so Google has something substantive to index.
  const description = rawDesc.trim().length >= 50
    ? rawDesc.slice(0, 160)
    : tags.length > 0
      ? `${title} — a ${tags.slice(0, 3).join(', ')} class on JungleGym. Pay once, own forever.`
      : `${title} — a movement class on JungleGym. Pay once, own forever.`
  const image = data.thumbnail_url as string | null

  return {
    title,
    description,
    keywords: tags.length > 0 ? tags : undefined,
    alternates: { canonical: `/video/${id}` },
    openGraph: {
      type: 'video.other',
      title,
      description,
      url: `/video/${id}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function VideoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: video } = await (supabase as any)
    .from('videos')
    .select('title, description, thumbnail_url, duration_seconds, created_at, creator_id')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  let creatorName: string | null = null
  if (video?.creator_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('display_name, username')
      .eq('user_id', video.creator_id)
      .maybeSingle()
    creatorName = profile?.display_name ?? profile?.username ?? null
  }

  const jsonLd = video
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: video.title,
        description: video.description ?? 'A movement class on JungleGym.',
        thumbnailUrl: video.thumbnail_url ?? undefined,
        uploadDate: video.created_at ?? undefined,
        duration: video.duration_seconds
          ? `PT${Math.round(video.duration_seconds)}S`
          : undefined,
        contentUrl: `https://junglegym.academy/video/${id}`,
        author: creatorName ? { '@type': 'Person', name: creatorName } : undefined,
        publisher: {
          '@type': 'Organization',
          name: 'JungleGym',
          logo: { '@type': 'ImageObject', url: 'https://junglegym.academy/icon.svg' },
        },
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
      <Suspense fallback={<VideoDetailSkeleton />}>
        <VideoContent videoId={id} />
      </Suspense>
      <FooterCompact />
    </div>
  )
}
