import { NavbarSkeleton, CheckoutSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <NavbarSkeleton />
      <CheckoutSkeleton />
    </div>
  )
}
