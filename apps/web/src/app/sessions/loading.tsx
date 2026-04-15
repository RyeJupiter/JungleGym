import { NavbarSkeleton, SearchBarSkeleton, SessionsPageCardSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <NavbarSkeleton />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-stone-900">Live Sessions</h1>
          <p className="text-stone-500 mt-2">Gift-based. No minimums. 80% of your gift goes to the creator.</p>
        </div>
        <SearchBarSkeleton />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SessionsPageCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
