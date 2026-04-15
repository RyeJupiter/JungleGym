import { NavbarSkeleton, GrowingTree } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <NavbarSkeleton />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-stone-900">My Library</h1>
          <p className="text-stone-500 mt-2">Classes you&apos;ve unlocked. Yours forever.</p>
        </div>
        <GrowingTree message="Growing your library..." />
      </div>
    </div>
  )
}
