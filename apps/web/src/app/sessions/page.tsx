import { Suspense } from 'react'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { SearchBar } from '@/components/SearchBar'
import { SessionsPageCardSkeleton } from '@/components/skeletons'
import { SessionsContent } from './SessionsContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Movement Sessions — Gift-Based',
  description:
    'Join live movement classes on JungleGym. Gift-based — give freely. 80% of your gift goes directly to the teacher. Yoga, strength, mobility, and more.',
  alternates: { canonical: '/sessions' },
  openGraph: {
    title: 'Live Sessions on JungleGym',
    description:
      'Join live movement classes. Gift-based — no minimums. Real teachers, real community.',
    url: '/sessions',
  },
}

function SessionsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SessionsPageCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>
}) {
  const { tag, q } = await searchParams

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900">Live Sessions</h1>
          <p className="text-stone-500 mt-2 text-sm sm:text-base">
            Gift-based. No minimums. 80% of your gift goes to the creator.
          </p>
        </div>

        <SearchBar
          basePath="/sessions"
          placeholder="Search sessions..."
          query={q}
          tag={tag}
          showTags
        />

        <Suspense fallback={<SessionsListSkeleton />}>
          <SessionsContent q={q} tag={tag} />
        </Suspense>
      </div>
      <FooterCompact />
    </div>
  )
}
