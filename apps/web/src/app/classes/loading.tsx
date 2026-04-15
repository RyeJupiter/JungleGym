import { NavbarSkeleton, SearchBarSkeleton, VideoGridSkeleton, Skeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <NavbarSkeleton />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-stone-900">Classes</h1>
          <p className="text-stone-500 mt-2">Movement classes from skilled guides. Pay once, own forever.</p>
        </div>
        <SearchBarSkeleton />
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-40 rounded" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
        <VideoGridSkeleton count={9} />
      </div>
    </div>
  )
}
