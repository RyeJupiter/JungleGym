import { NavbarSkeleton, Skeleton, StudioSessionsSkeleton, StudioVideosSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <NavbarSkeleton />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-black text-stone-900">Studio</h1>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
        </div>
        <section className="mb-12">
          <h2 className="text-xl font-bold text-stone-900 mb-4">Live sessions</h2>
          <StudioSessionsSkeleton count={2} />
        </section>
        <section className="mb-12">
          <h2 className="text-xl font-bold text-stone-900 mb-4">Your videos</h2>
          <StudioVideosSkeleton count={3} />
        </section>
      </div>
    </div>
  )
}
