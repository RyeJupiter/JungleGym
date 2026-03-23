import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen">

      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 bg-jungle-900/95 backdrop-blur border-b border-jungle-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-black text-xl tracking-tight text-white">
            jungle<span className="text-jungle-400">gym</span>
          </span>
          <div className="flex items-center gap-3">
            <Link href="/explore" className="text-sm text-jungle-300 hover:text-white font-medium transition-colors">
              Explore
            </Link>
            <Link href="/sessions" className="text-sm text-jungle-300 hover:text-white font-medium transition-colors">
              Sessions
            </Link>
            {user ? (
              <>
                <Link href="/library" className="text-sm text-jungle-300 hover:text-white font-medium transition-colors">
                  Library
                </Link>
                <Link href="/profile" className="bg-earth-400 hover:bg-earth-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-jungle-300 hover:text-white font-medium px-4 py-2 transition-colors">
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-earth-400 hover:bg-earth-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Join free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-jungle-800 pt-16">
        <section className="pt-28 pb-24 px-6 text-center">
          <div className="max-w-3xl mx-auto">
                <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-white mb-6 leading-none">
              Welcome to JungleGym.
              <br />
              <span className="text-jungle-400">Let's learn & play.</span>
            </h1>
            <p className="text-lg text-jungle-300 mb-10 max-w-xl mx-auto leading-relaxed">
              Explore movement classes from vetted teachers below.
              Every class gives you something real to train — today, not someday.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <Link
                href="/explore"
                className="bg-earth-400 hover:bg-earth-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors"
              >
                Browse videos →
              </Link>
              <Link
                href="/sessions"
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors border border-white/20"
              >
                Live sessions
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[['yoga','🧘 yoga'], ['strength','💪 strength'], ['mobility','🌀 mobility'], ['kettlebell','🔔 kettlebell'], ['breathwork','🌬️ breathwork'], ['hip-flexors','🦋 hip flexors'], ['contact-dance','🤝 contact dance'], ['dance','💃 dance lifts']].map(([slug, label]) => (
                <Link key={slug} href={`/explore?tag=${slug}`} className="bg-jungle-700/60 hover:bg-jungle-600/80 text-jungle-200 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How it works — quick 3-step */}
        <section className="pb-20 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {[
              { emoji: '🔍', title: 'Find a teacher', body: 'Browse by style — yoga, kettlebell, mobility, breathwork, and more.', href: '/explore' },
              { emoji: '🎬', title: 'Watch & train', body: '100% goes to the teacher. We suggest a 10% optional donation to keep the lights on — you set it.', href: '/explore' },
              { emoji: '🎁', title: 'Join live sessions', body: 'Real-time classes, gift-based. Give freely — 100% goes to the teacher.', href: '/sessions' },
            ].map((step) => (
              <Link key={step.title} href={step.href} className="bg-jungle-800/60 hover:bg-jungle-700/80 rounded-2xl p-6 border border-jungle-700 hover:border-jungle-500 transition-colors block">
                <div className="text-4xl mb-3">{step.emoji}</div>
                <h3 className="font-bold text-white mb-1">{step.title}</h3>
                <p className="text-jungle-400 text-sm leading-relaxed">{step.body}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Pricing — fun & transparent */}
      <section className="py-20 px-6 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-jungle-500 uppercase tracking-widest mb-3">Radical Transparency</p>
            <h2 className="text-4xl font-black text-jungle-900 mb-3">Here's how the money flows.</h2>
            <p className="text-jungle-600 max-w-xl mx-auto text-lg">
              Buy classes, yours permanently. Every video is priced by the minute — choose the price that feels right for you.
            </p>
          </div>

          {/* Example */}
          <div className="bg-white border border-jungle-200 rounded-2xl p-6 mb-8 max-w-lg mx-auto text-center">
            <p className="text-xs font-semibold text-jungle-500 uppercase tracking-widest mb-3">Example: 10-minute kettlebell class</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { emoji: '🌱', tier: 'Supported', rate: '$1/min', price: '$10' },
                { emoji: '🌿', tier: 'Community', rate: '$2/min', price: '$20' },
                { emoji: '🌳', tier: 'Abundance', rate: '$3/min', price: '$30' },
              ].map((t) => (
                <div key={t.tier} className="bg-jungle-50 rounded-xl p-3">
                  <div className="text-2xl mb-1">{t.emoji}</div>
                  <p className="font-black text-jungle-900 text-lg">{t.price}</p>
                  <p className="text-xs text-jungle-600 font-semibold">{t.tier}</p>
                  <p className="text-xs text-jungle-400">{t.rate}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-3">Clean round numbers. No $9.99 games here.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                emoji: '🌱',
                tier: 'Supported',
                tagline: 'The floor',
                desc: 'The minimum. Full access, no asterisks. Pick this when money is tight — teachers know and they appreciate you showing up.',
                badge: '$1/min',
                bg: 'bg-white',
                border: 'border-jungle-200',
              },
              {
                emoji: '🌿',
                tier: 'Community',
                tagline: 'The sweet spot',
                desc: "You're sustaining someone's practice. This is the tier most people choose when things are going okay.",
                badge: '$2/min',
                bg: 'bg-jungle-50',
                border: 'border-jungle-300',
              },
              {
                emoji: '🌳',
                tier: 'Abundance',
                tagline: 'Pay it forward',
                desc: "When you're doing well, this is how you spread it. 100% goes to the teacher. They feel this one.",
                badge: '$3/min',
                bg: 'bg-jungle-100',
                border: 'border-jungle-400',
              },
            ].map((t) => (
              <div key={t.tier} className={`${t.bg} border ${t.border} rounded-2xl p-6`}>
                <div className="text-3xl mb-3">{t.emoji}</div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-black text-jungle-900 text-lg">{t.tier}</h3>
                  <span className="bg-jungle-900 text-jungle-300 text-xs font-bold px-3 py-1 rounded-full">{t.badge}</span>
                </div>
                <p className="text-jungle-600 text-xs font-semibold uppercase tracking-wide mb-2">{t.tagline}</p>
                <p className="text-jungle-700 text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 space-y-1">
            <p className="text-jungle-700 text-sm font-semibold">Every creator offers one free video. No account needed to watch it.</p>
            <p className="text-jungle-500 text-sm">You can also share any video you own with one friend — on us.</p>
          </div>
        </div>
      </section>

      {/* Live sessions */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-black mb-4 text-jungle-900">Live classes run on vibes and generosity</h2>
            <p className="text-jungle-700 text-lg mb-4 leading-relaxed">
              Live sessions are gift-based — no price tag, no minimum.{' '}
              <strong className="text-jungle-900">Every dollar you give goes to the teacher.</strong>{' '}
              We add a small optional platform donation on top (10% by default, adjustable to zero).
            </p>
            <p className="text-jungle-500 text-sm">
              Real generosity, freely given. That&apos;s the whole vibe.
            </p>
            <Link href="/sessions" className="mt-6 inline-block bg-jungle-900 hover:bg-jungle-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
              See upcoming sessions →
            </Link>
          </div>
          <div className="bg-jungle-50 rounded-2xl p-8 border border-jungle-100">
            <p className="text-xs font-semibold text-jungle-500 mb-1 tracking-widest uppercase">Example gift breakdown</p>
            <div className="text-5xl font-black text-jungle-900 mb-5">$20</div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-jungle-700">Goes to teacher</span>
                <span className="font-black text-jungle-900 text-lg">$20.00 🎉</span>
              </div>
              <div className="flex justify-between items-center text-jungle-500">
                <span>Platform donation (10%, you set this)</span>
                <span className="font-medium">+ $2.00</span>
              </div>
              <div className="border-t border-jungle-200 pt-3 flex justify-between items-center">
                <span className="font-semibold text-jungle-900">You pay total</span>
                <span className="font-black text-jungle-900 text-xl">$22.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy blurb */}
      <section className="py-20 px-6 bg-jungle-900 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-6">🐒</div>
          <p className="text-jungle-400 text-sm font-semibold uppercase tracking-widest mb-3">The oldest wisdom</p>
          <h2 className="text-4xl font-black text-white mb-4">Monkey see. Monkey do.</h2>
          <p className="text-jungle-300 text-lg leading-relaxed mb-8">
            Mimicry is the oldest way to learn — and JungleGym is built on that idea.
            Watch someone move with ease, and your body starts to understand.
            Vetted teachers who move clearly, so you can read them and grow.
          </p>
          <Link
            href="/auth/signup"
            className="bg-earth-400 hover:bg-earth-500 text-white font-bold px-10 py-4 rounded-xl text-lg inline-block transition-colors"
          >
            Join free — no credit card needed
          </Link>
        </div>
      </section>

    </div>
  )
}
