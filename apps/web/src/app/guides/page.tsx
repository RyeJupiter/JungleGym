import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Movement Guides' }

export default async function GuidesPage() {
  const supabase = await createServerSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: guides } = await (supabase as any)
    .from('profiles')
    .select('username, display_name, photo_url')
    .not('supported_rate', 'is', null)
    .order('display_name', { ascending: true })

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-stone-900">Movement Guides</h1>
          <p className="text-stone-500 mt-2">
            Vetted teachers. Real movement. Browse their classes and join their sessions.
          </p>
        </div>

        {(guides ?? []).length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <div className="text-5xl mb-4">🌿</div>
            <p className="font-medium">No guides yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(guides ?? []).map((g: { username: string; display_name: string; photo_url: string | null }) => (
              <Link
                key={g.username}
                href={`/@${g.username}`}
                className="bg-white rounded-2xl border border-stone-200 p-5 hover:border-jungle-400 hover:shadow-md transition-all group flex flex-col items-center text-center gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-jungle-100 overflow-hidden flex items-center justify-center text-2xl flex-shrink-0">
                  {g.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : '🌿'}
                </div>
                <div>
                  <p className="font-black text-stone-900 group-hover:text-jungle-700 transition-colors leading-tight">
                    {g.display_name}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">@{g.username}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
