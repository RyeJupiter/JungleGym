import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/auth/login')

  const [{ data: profile }, { data: user }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', authUser.id).single(),
    supabase.from('users').select('role').eq('id', authUser.id).single(),
  ])

  const isCreator = user?.role === 'creator'
  const isAdmin = ['rye.seekins@gmail.com', 'davis@earthpulse.dev'].includes(authUser.email ?? '')

  const [{ count: videoCount }, { count: purchaseCount }, { count: sessionCount }] =
    await Promise.all([
      isCreator
        ? supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', authUser.id)
        : Promise.resolve({ count: 0 }),
      !isCreator
        ? supabase
            .from('purchases')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', authUser.id)
        : Promise.resolve({ count: 0 }),
      supabase
        .from('live_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', authUser.id)
        .gte('scheduled_at', new Date().toISOString())
        .eq('status', 'scheduled'),
    ])

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-jungle-900">
            Hey{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-jungle-600 mt-1 capitalize">{user?.role === 'creator' ? 'Teacher' : 'Learner'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 pt-4">
          <StatCard
            label={isCreator ? 'Your videos' : 'Classes dropped into'}
            value={String(isCreator ? (videoCount ?? 0) : (purchaseCount ?? 0))}
            href={isCreator ? '/studio' : '/library'}
          />
          <StatCard label="Upcoming sessions" value={String(sessionCount ?? 0)} href="/sessions" />
          <StatCard label="Profile" value="Edit →" href="/profile" />
        </div>

        {isCreator ? (
          <div className="bg-jungle-900 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-2">Your studio</h2>
            <p className="text-jungle-400 mb-4">
              Upload videos, schedule live sessions, and share what you love.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/studio/upload"
                className="bg-earth-400 hover:bg-earth-500 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                Upload video
              </Link>
              <Link
                href="/studio/sessions/new"
                className="bg-jungle-800 hover:bg-jungle-700 text-jungle-200 font-semibold px-5 py-2.5 rounded-lg text-sm border border-jungle-700 transition-colors"
              >
                Schedule session
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-jungle-100 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-jungle-900 mb-2">Keep exploring</h2>
            <p className="text-jungle-700 mb-4">
              Find movement teachers and content that gives you something to train.
            </p>
            <Link
              href="/explore"
              className="bg-jungle-900 hover:bg-jungle-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm inline-block transition-colors"
            >
              Browse teachers
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl p-6 border border-jungle-100 hover:border-jungle-300 transition-colors shadow-sm"
    >
      <p className="text-xs font-semibold text-jungle-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-jungle-900">{value}</p>
    </Link>
  )
}
