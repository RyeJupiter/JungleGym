import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { MembershipButton } from '@/components/MembershipButton'
import { Footer } from '@/components/Footer'

export default async function HomePage() {
  return (
    <div className="min-h-screen">

      <Navbar />

      {/* Hero */}
      <div className="bg-jungle-800">
        <section className="pt-28 pb-24 px-6 text-center">
          <div className="max-w-3xl mx-auto">
                <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-white mb-6 leading-none" style={{ textShadow: '-1px -1px 0 rgba(0,0,0,0.25), 1px -1px 0 rgba(0,0,0,0.25), -1px 1px 0 rgba(0,0,0,0.25), 1px 1px 0 rgba(0,0,0,0.25)' }}>
              Welcome to JungleGym.
              <br />
              <span className="text-jungle-400">Let&apos;s learn &amp; play.</span>
            </h1>
            <p className="text-lg text-jungle-300 mb-10 max-w-xl mx-auto leading-relaxed">
              Movement classes from skilled guides.
              Every class leaves you with something your body didn't have before.
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
              { emoji: '🎬', title: 'Watch & train', body: 'The price you see is the price you pay. 80% goes to the teacher, 20% platform fee.', href: '/explore' },
              { emoji: '🎁', title: 'Join live sessions', body: 'Real-time classes, gift-based. Give freely — 80% to the teacher, 20% platform fee.', href: '/sessions' },
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
              Buy classes, yours permanently. Every video is priced by the minute — 80% goes to the teacher, 20% platform fee keeps JungleGym running.
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                emoji: '🌱',
                tier: 'Supported',
                tagline: 'The floor',
                desc: 'Full access, no asterisks. Pick this when money is tight.',
                badge: '$1/min',
                bg: 'bg-white',
                border: 'border-jungle-200',
              },
              {
                emoji: '🌿',
                tier: 'Community',
                tagline: 'The sweet spot',
                desc: "Sustaining someone's practice. The tier most people choose.",
                badge: '$2/min',
                bg: 'bg-jungle-50',
                border: 'border-jungle-300',
              },
              {
                emoji: '🌳',
                tier: 'Abundance',
                tagline: 'Pay it forward',
                desc: "When you're doing well, this is how you spread it.",
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

          <div className="text-center mt-8 space-y-2">
            <p className="text-jungle-900 text-sm font-bold">The price you see is the price you pay. 80% goes to the teacher, 20% platform fee.</p>
            <p className="text-jungle-500 text-sm">No hidden fees. No surprises. Just a clean, honest split.</p>
            <p className="text-jungle-500 text-sm">You can also share any video you own with one friend — on us.</p>
          </div>

          {/* Membership */}
          <div id="membership" className="mt-16 bg-jungle-900 rounded-3xl p-10 text-center">
            <p className="text-xs font-semibold text-jungle-400 uppercase tracking-widest mb-3">Membership</p>
            <h3 className="text-3xl font-black text-white mb-3">Six videos. One month. $100.</h3>
            <p className="text-jungle-300 text-lg mb-2 max-w-lg mx-auto leading-relaxed">
              Pick any six videos from the catalog and own them for the month.
              Swap your picks each renewal.
            </p>
            <p className="text-jungle-400 text-sm mb-8 max-w-md mx-auto">
              <strong className="text-jungle-200">80% goes to the creators</strong> whose videos you pick.
              20% platform fee keeps JungleGym running.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8 text-sm text-jungle-300">
              {['Access to any 6 videos', 'Swap picks each month', '80% to creators', 'Cancel any time'].map((f) => (
                <span key={f} className="flex items-center gap-1.5 justify-center">
                  <span className="text-jungle-400">✓</span> {f}
                </span>
              ))}
            </div>
            <MembershipButton />
          </div>
        </div>
      </section>

      {/* Live sessions */}
      <section className="py-14 px-6 bg-white border-t border-stone-100">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-jungle-900 mb-1">Live classes, gift-based.</h2>
            <p className="text-jungle-600 text-sm">Real-time sessions from vetted teachers. Give what you feel — 80% to the teacher, 20% platform fee.</p>
          </div>
          <Link href="/sessions" className="shrink-0 bg-jungle-900 hover:bg-jungle-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors whitespace-nowrap">
            Check out live classes →
          </Link>
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

      <Footer />
    </div>
  )
}
