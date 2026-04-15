import { NavbarSkeleton, SettingsFormSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <NavbarSkeleton />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <SettingsFormSkeleton />
      </div>
    </div>
  )
}
