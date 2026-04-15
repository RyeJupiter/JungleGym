import { NavbarSkeleton, SearchBarSkeleton, VideoGridSkeleton, ExploreGuideCardSkeleton, SessionListSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <NavbarSkeleton />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-stone-900">Explore</h1>
          <p className="text-stone-500 mt-2">Discover movement classes, guides, and live sessions.</p>
        </div>
        <SearchBarSkeleton />
        <section className="mb-14">
          <h2 className="text-2xl font-black text-stone-900 mb-6">Latest Videos</h2>
          <VideoGridSkeleton count={6} />
        </section>
        <section className="mb-14">
          <h2 className="text-2xl font-black text-stone-900 mb-6">Guides</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ExploreGuideCardSkeleton key={i} />
            ))}
          </div>
        </section>
        <section className="mb-14">
          <h2 className="text-2xl font-black text-stone-900 mb-6">Live Sessions</h2>
          <SessionListSkeleton count={4} />
        </section>
      </div>
    </div>
  )
}
