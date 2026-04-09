import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDuration, formatPrice } from '@junglegym/shared'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Library' }

export default async function LibraryPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: purchases } = await supabase
    .from('purchases')
    .select('*, videos(id, title, thumbnail_url, duration_seconds, tags, profiles!creator_id(display_name, username))')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-black text-xl text-jungle-800">
          jungle<span className="text-jungle-500">gym</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-stone-600">
          <Link href="/explore" className="hover:text-stone-900">Explore</Link>
          <Link href="/dashboard" className="hover:text-stone-900">Dashboard</Link>
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black text-stone-900 mb-10">My Classes</h1>

        {(purchases ?? []).length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <div className="text-5xl mb-4">🌿</div>
            <p className="font-medium">You haven't dropped into any classes yet.</p>
            <Link href="/explore" className="mt-4 inline-block text-jungle-600 font-semibold hover:underline">
              Explore classes →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {purchases!.map((purchase) => {
              const video = purchase.videos as {
                id: string; title: string; thumbnail_url: string | null;
                duration_seconds: number | null; tags: string[];
                profiles: { display_name: string; username: string } | null
              } | null
              if (!video) return null
              return (
                <Link key={purchase.id} href={`/video/${video.id}`}>
                  <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-jungle-300 transition-colors group shadow-sm">
                    <div className="aspect-video bg-stone-100 relative">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>
                      )}
                      {video.duration_seconds && (
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(video.duration_seconds)}
                        </span>
                      )}
                      <span className="absolute top-2 left-2 bg-jungle-600 text-white text-xs font-bold px-2 py-0.5 rounded-full capitalize">
                        {purchase.tier}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-jungle-700 font-semibold mb-1">@{video.profiles?.username}</p>
                      <h3 className="font-bold text-stone-900 text-sm leading-snug group-hover:text-jungle-700 transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-xs text-stone-400 mt-1">Dropped in · {formatPrice(purchase.amount_paid)}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
