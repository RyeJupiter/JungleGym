import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { FooterCompact } from '@/components/FooterCompact'
import { SearchBar } from '@/components/SearchBar'
import { LibraryGridSkeleton } from '@/components/skeletons'
import { LibraryContent } from './LibraryContent'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Library' }

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900">My Library</h1>
          <p className="text-stone-500 mt-2 text-sm sm:text-base">
            Classes you&apos;ve unlocked. Yours forever.
          </p>
        </div>

        <SearchBar
          basePath="/library"
          placeholder="Search your library..."
          query={q}
        />

        <Suspense fallback={<LibraryGridSkeleton count={6} />}>
          <LibraryContent userId={user.id} query={q} />
        </Suspense>
      </div>
      <FooterCompact />
    </div>
  )
}
