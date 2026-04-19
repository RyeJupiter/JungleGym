import { Suspense } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { SearchBar } from '@/components/SearchBar'
import { VideoGridSkeleton, SessionListSkeleton, ExploreGuideCardSkeleton } from '@/components/skeletons'
import { ExploreVideos, ExploreGuides, ExploreSessions } from './ExploreContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore Movement Teachers, Classes & Live Sessions',
  description:
    'Discover movement classes, real teachers, and live sessions on JungleGym. Find yoga, strength, mobility, breathwork, and dance from people who love what they teach.',
  alternates: { canonical: '/explore' },
  openGraph: {
    title: 'Explore JungleGym',
    description:
      'Discover movement classes, real teachers, and live sessions on JungleGym.',
    url: '/explore',
  },
}

function GuidesSectionSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <ExploreGuideCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>
}) {
  const { q, tag } = await searchParams

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900">Explore</h1>
          <p className="text-stone-500 mt-2 text-sm sm:text-base">
            Discover movement classes, guides, and live sessions.
          </p>
        </div>

        <SearchBar
          basePath="/explore"
          placeholder="Search classes, guides, sessions..."
          query={q}
          tag={tag}
          showTags
        />

        {/* ── Latest Videos ─────────────────────────────────── */}
        <section className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Link href="/classes" className="group">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 group-hover:text-jungle-700 transition-colors">
                Latest Videos <span className="text-jungle-500 group-hover:text-jungle-600">&rarr;</span>
              </h2>
            </Link>
          </div>
          <Suspense fallback={<VideoGridSkeleton count={6} />}>
            <ExploreVideos q={q} tag={tag} />
          </Suspense>
        </section>

        {/* ── Guides ───────────────────────────────────────── */}
        <section className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Link href="/guides" className="group">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 group-hover:text-jungle-700 transition-colors">
                Guides <span className="text-jungle-500 group-hover:text-jungle-600">&rarr;</span>
              </h2>
            </Link>
          </div>
          <Suspense fallback={<GuidesSectionSkeleton />}>
            <ExploreGuides q={q} tag={tag} />
          </Suspense>
        </section>

        {/* ── Live Sessions ────────────────────────────────── */}
        <section className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Link href="/sessions" className="group">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 group-hover:text-jungle-700 transition-colors">
                Live Sessions <span className="text-jungle-500 group-hover:text-jungle-600">&rarr;</span>
              </h2>
            </Link>
          </div>
          <Suspense fallback={<SessionListSkeleton count={4} />}>
            <ExploreSessions q={q} tag={tag} />
          </Suspense>
        </section>
      </div>
      <FooterCompact />
    </div>
  )
}
