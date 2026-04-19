import { Suspense } from 'react'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { SearchBar } from '@/components/SearchBar'
import { GuideGridSkeleton } from '@/components/skeletons'
import { GuidesContent } from './GuidesContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Movement Guides — Vetted Teachers on JungleGym',
  description:
    'Meet the teachers on JungleGym. Every guide is vetted — yoga, strength, mobility, breathwork, dance, kettlebell. Real practice, real transmission.',
  alternates: { canonical: '/guides' },
  openGraph: {
    title: 'Movement Guides on JungleGym',
    description: 'Vetted teachers sharing what they love.',
    url: '/guides',
  },
}

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>
}) {
  const { tag, q } = await searchParams

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900">Movement Guides</h1>
          <p className="text-stone-500 mt-2 text-sm sm:text-base">
            Vetted teachers. Real movement. Browse their classes and join their sessions.
          </p>
        </div>

        <SearchBar
          basePath="/guides"
          placeholder="Search guides..."
          query={q}
          tag={tag}
          showTags
        />

        <Suspense fallback={<GuideGridSkeleton count={8} />}>
          <GuidesContent q={q} tag={tag} />
        </Suspense>
      </div>
      <FooterCompact />
    </div>
  )
}
