import { Suspense } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { SearchBar } from '@/components/SearchBar'
import { VideoGridSkeleton } from '@/components/skeletons'
import { ClassesContent } from './ClassesContent'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Classes' }

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; sort?: string }>
}) {
  const { tag, q, sort } = await searchParams

  function sortUrl(s: string) {
    const params = new URLSearchParams()
    if (tag) params.set('tag', tag)
    if (q) params.set('q', q)
    if (s !== 'newest') params.set('sort', s)
    const qs = params.toString()
    return `/classes${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-stone-900">Classes</h1>
          <p className="text-stone-500 mt-2">
            Movement classes from skilled guides. Pay once, own forever.
          </p>
        </div>

        <SearchBar
          basePath="/classes"
          placeholder="Search videos..."
          query={q}
          tag={tag}
          showTags
          preserveParams={sort ? { sort } : {}}
        />

        {/* Sort + heading */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-stone-900">
            {q ? `Results for "${q}"` : tag ? `#${tag}` : 'Latest videos'}
          </h2>
          <div className="flex gap-1 text-sm">
            <Link
              href={sortUrl('newest')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                sort !== 'popular' ? 'bg-jungle-600 text-white' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Newest
            </Link>
            <Link
              href={sortUrl('popular')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                sort === 'popular' ? 'bg-jungle-600 text-white' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Popular
            </Link>
          </div>
        </div>

        <Suspense fallback={<VideoGridSkeleton count={9} />}>
          <ClassesContent q={q} tag={tag} sort={sort} />
        </Suspense>
      </div>
      <FooterCompact />
    </div>
  )
}
