/**
 * Skeleton loading primitives and composites.
 * All skeletons use Tailwind's animate-pulse for a clean fade effect.
 */

/* ─── Base ──────────────────────────────────────────────────── */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-200 rounded ${className}`} />
}

/* ─── Navbar ───────────────────────────────────────────────── */

export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-40 bg-jungle-900 border-b border-jungle-800 px-6 h-16 flex items-center justify-between">
      <span className="font-black text-xl text-white font-display">
        jungle<span className="text-jungle-400">gym</span>
      </span>
      <div className="flex items-center gap-4">
        <div className="h-3 w-12 rounded bg-jungle-800 animate-pulse" />
        <div className="h-3 w-12 rounded bg-jungle-800 animate-pulse" />
        <div className="h-3 w-12 rounded bg-jungle-800 animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-jungle-800 animate-pulse" />
      </div>
    </header>
  )
}

/* ─── Search Bar ───────────────────────────────────────────── */

export function SearchBarSkeleton() {
  return (
    <div className="mb-8">
      <div className="h-11 w-full rounded-xl bg-white border border-stone-200 animate-pulse" />
    </div>
  )
}

/* ─── Video Card ────────────────────────────────────────────── */

export function VideoCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-stone-200">
      <Skeleton className="aspect-video rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
          <Skeleton className="h-3 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function VideoGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  )
}

/* ─── Library Card (slightly different — has tier pill + "Unlocked" text) ── */

export function LibraryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-stone-200">
      <div className="aspect-video relative">
        <Skeleton className="w-full h-full rounded-none" />
        <Skeleton className="absolute top-2 left-2 h-5 w-16 rounded-full" />
      </div>
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
      </div>
    </div>
  )
}

export function LibraryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <LibraryCardSkeleton key={i} />
      ))}
    </div>
  )
}

/* ─── Session Card ──────────────────────────────────────────── */

export function SessionCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-2/5 rounded" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded" />
      <div className="flex items-center gap-3">
        <Skeleton className="w-5 h-5 rounded-full" />
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-32 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
    </div>
  )
}

export function SessionListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SessionCardSkeleton key={i} />
      ))}
    </div>
  )
}

/* ─── Session Row (studio) ──────────────────────────────────── */

export function SessionRowSkeleton() {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="h-3 w-64 rounded" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
    </div>
  )
}

/* ─── Sessions Page Card (full-width with avatar) ───────────── */

export function SessionsPageCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        <div className="space-y-1.5 flex-shrink-0">
          <Skeleton className="h-3 w-20 rounded ml-auto" />
          <Skeleton className="h-3 w-14 rounded ml-auto" />
          <Skeleton className="h-3 w-12 rounded ml-auto" />
        </div>
      </div>
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-48 rounded" />
    </div>
  )
}

/* ─── Guide Card ────────────────────────────────────────────── */

export function GuideCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col items-center text-center gap-3">
      <Skeleton className="w-16 h-16 rounded-full" />
      <div className="space-y-2 flex flex-col items-center">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function GuideGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <GuideCardSkeleton key={i} />
      ))}
    </div>
  )
}

/* ─── Explore Page (small guide card variant) ───────────────── */

export function ExploreGuideCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 text-center border border-stone-200">
      <Skeleton className="w-14 h-14 rounded-full mx-auto mb-3" />
      <Skeleton className="h-4 w-20 rounded mx-auto mb-1" />
      <Skeleton className="h-3 w-14 rounded mx-auto mb-2" />
      <div className="flex justify-center gap-1">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  )
}

/* ─── Video Detail ──────────────────────────────────────────── */

export function VideoDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      {/* Player */}
      <Skeleton className="rounded-2xl aspect-video" />
      {/* Tags */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      {/* Title */}
      <Skeleton className="h-8 w-2/3 rounded" />
      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <Skeleton className="h-4 w-4/6 rounded" />
      </div>
      {/* Purchase area */}
      <Skeleton className="h-40 w-full rounded-2xl" />
      {/* Creator */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  )
}

/* ─── Session Detail ────────────────────────────────────────── */

export function SessionDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      {/* Back link */}
      <Skeleton className="h-3 w-24 rounded" />
      {/* Title */}
      <Skeleton className="h-8 w-3/5 rounded" />
      {/* Meta row */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
      </div>
      {/* Creator card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <Skeleton className="h-3 w-16 rounded mb-3" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>
      </div>
      {/* Stream placeholder */}
      <Skeleton className="rounded-2xl aspect-video" />
    </div>
  )
}

/* ─── Studio Video Row ──────────────────────────────────────── */

export function VideoRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <Skeleton className="w-20 h-12 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="h-3 w-32 rounded" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

export function StudioVideosSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
      {Array.from({ length: count }).map((_, i) => (
        <VideoRowSkeleton key={i} />
      ))}
    </div>
  )
}

export function StudioSessionsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
      {Array.from({ length: count }).map((_, i) => (
        <SessionRowSkeleton key={i} />
      ))}
    </div>
  )
}

/* ─── Settings Form ─────────────────────────────────────────── */

export function SettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  )
}

/* ─── Treehouse (creator profile) ───────────────────────────── */

export function TreehouseSkeleton() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="relative py-16 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-4">
          <Skeleton className="w-28 h-28 rounded-full" />
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
      {/* Pricing bar */}
      <div className="max-w-4xl mx-auto px-6">
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
      {/* Video grid */}
      <div className="max-w-4xl mx-auto px-6">
        <Skeleton className="h-6 w-32 rounded mb-4" />
        <VideoGridSkeleton count={3} />
      </div>
    </div>
  )
}

/* ─── Video Manage (studio) ─────────────────────────────────── */

export function VideoManageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-8 w-24 rounded" />
          </div>
        ))}
      </div>
      {/* Tabs */}
      <Skeleton className="h-10 w-48 rounded-xl" />
      {/* Content */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

/* ─── Admin ─────────────────────────────────────────────────── */

export function AdminSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <Skeleton className="h-10 w-24 rounded" />
      {/* Tab nav */}
      <Skeleton className="h-10 w-64 rounded-xl" />
      {/* Content */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Creator Detail (admin) ────────────────────────────────── */

export function CreatorDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <Skeleton className="h-3 w-28 rounded" />
      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 flex items-start gap-5">
        <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-3 w-36 rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-8 w-24 rounded" />
          </div>
        ))}
      </div>
      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    </div>
  )
}

/* ─── Checkout ──────────────────────────────────────────────── */

export function CheckoutSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left: video card */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="rounded-xl aspect-video" />
          <Skeleton className="h-5 w-3/4 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-full" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        {/* Right: checkout form */}
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

/* ─── Growing Tree (loading animation) ─────────────────────── */

export function GrowingTree({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <style>{`
        @keyframes jg-grow-trunk {
          0% { stroke-dashoffset: 160; }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes jg-grow-branch {
          0%, 25% { stroke-dashoffset: 55; opacity: 0; }
          30% { opacity: 1; }
          60% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes jg-grow-leaf {
          0%, 35% { transform: scale(0); opacity: 0; }
          65% { transform: scale(1.15); opacity: 1; }
          80% { transform: scale(0.95); }
          90%, 100% { transform: scale(1); opacity: 1; }
        }
        @keyframes jg-sway {
          0%, 100% { transform: rotate(-0.8deg); }
          50% { transform: rotate(0.8deg); }
        }
        .jg-trunk {
          stroke-dasharray: 160;
          animation: jg-grow-trunk 2.5s ease-out forwards;
        }
        .jg-branch {
          stroke-dasharray: 55;
          animation: jg-grow-branch 2.5s ease-out forwards;
        }
        .jg-leaf {
          transform-box: fill-box;
          transform-origin: center;
          animation: jg-grow-leaf 2.5s ease-out forwards;
        }
        .jg-tree-wrap {
          transform-origin: 100px 262px;
          animation: jg-sway 4s ease-in-out 2.5s infinite;
        }
      `}</style>
      <svg viewBox="0 0 200 280" width="140" height="196" className="jg-tree-wrap">
        {/* Ground shadow */}
        <ellipse cx="100" cy="262" rx="30" ry="4" fill="#d6d3d1" opacity="0.4" />

        {/* Trunk */}
        <path d="M100 260 L100 100" className="jg-trunk" stroke="#1b4332" strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* Branches — left */}
        <path d="M100 200 L65 178" className="jg-branch" style={{ animationDelay: '0.3s' }} stroke="#1c5c3c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M100 165 L55 138" className="jg-branch" style={{ animationDelay: '0.6s' }} stroke="#1c5c3c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M100 135 L70 108" className="jg-branch" style={{ animationDelay: '0.9s' }} stroke="#1c5c3c" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Branches — right */}
        <path d="M100 200 L135 178" className="jg-branch" style={{ animationDelay: '0.4s' }} stroke="#1c5c3c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M100 165 L145 138" className="jg-branch" style={{ animationDelay: '0.7s' }} stroke="#1c5c3c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M100 135 L130 108" className="jg-branch" style={{ animationDelay: '1.0s' }} stroke="#1c5c3c" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Leaves — bottom pair */}
        <circle cx="60" cy="173" r="13" className="jg-leaf" style={{ animationDelay: '0.6s' }} fill="#237a51" />
        <circle cx="140" cy="173" r="13" className="jg-leaf" style={{ animationDelay: '0.7s' }} fill="#237a51" />

        {/* Leaves — middle pair */}
        <circle cx="50" cy="133" r="15" className="jg-leaf" style={{ animationDelay: '0.9s' }} fill="#3d9e6b" />
        <circle cx="150" cy="133" r="15" className="jg-leaf" style={{ animationDelay: '1.0s' }} fill="#3d9e6b" />

        {/* Small accent leaves */}
        <circle cx="42" cy="152" r="8" className="jg-leaf" style={{ animationDelay: '1.1s' }} fill="#3d9e6b" opacity="0.7" />
        <circle cx="158" cy="152" r="8" className="jg-leaf" style={{ animationDelay: '1.15s' }} fill="#3d9e6b" opacity="0.7" />

        {/* Leaves — top pair */}
        <circle cx="66" cy="103" r="12" className="jg-leaf" style={{ animationDelay: '1.2s' }} fill="#237a51" />
        <circle cx="134" cy="103" r="12" className="jg-leaf" style={{ animationDelay: '1.3s' }} fill="#237a51" />

        {/* Crown */}
        <circle cx="100" cy="85" r="18" className="jg-leaf" style={{ animationDelay: '1.4s' }} fill="#3d9e6b" />
        <circle cx="84" cy="78" r="10" className="jg-leaf" style={{ animationDelay: '1.5s' }} fill="#237a51" opacity="0.8" />
        <circle cx="116" cy="78" r="10" className="jg-leaf" style={{ animationDelay: '1.5s' }} fill="#237a51" opacity="0.8" />
      </svg>
      <p className="text-stone-400 text-sm mt-4 animate-pulse">{message}</p>
    </div>
  )
}

/* ─── Session Manage (studio) ───────────────────────────────── */

export function SessionManageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 rounded" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-8 w-24 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
