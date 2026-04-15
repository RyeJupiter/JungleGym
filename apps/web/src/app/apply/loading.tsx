import { Skeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="font-black text-2xl text-stone-900 font-display">
            jungle<span className="text-jungle-600">gym</span>
          </span>
          <h1 className="text-3xl font-black text-stone-900 mt-6">Become a teacher</h1>
          <p className="text-stone-500 mt-2">We curate every creator on the network. Tell us about your practice.</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-8 space-y-4 shadow-sm">
          <Skeleton className="h-6 w-48 rounded mx-auto" />
          <Skeleton className="h-4 w-64 rounded mx-auto" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg mx-auto" />
        </div>
      </div>
    </main>
  )
}
