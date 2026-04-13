import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
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
      <section className="py-20 px-6 bg-jungle-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-jungle-500 uppercase tracking-widest mb-3">Radical Transparency</p>
            <h2 className="text-4xl font-black text-white mb-3">Here&apos;s how the money flows.</h2>
            <p className="text-jungle-300 max-w-xl mx-auto text-lg">
              Each video has three prices set by the teacher. Pick the one that fits you — 80% goes to the teacher, 20% platform fee keeps JungleGym running.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                emoji: '🌱',
                tier: 'Supported',
                tagline: 'The floor',
                desc: 'Full access, no asterisks. Pick this when money is tight.',
                bg: 'bg-jungle-800/50',
                border: 'border-jungle-700',
              },
              {
                emoji: '🌿',
                tier: 'Community',
                tagline: 'The sweet spot',
                desc: "Sustaining someone's practice. The tier most people choose.",
                bg: 'bg-jungle-800/70',
                border: 'border-jungle-600',
              },
              {
                emoji: '🌳',
                tier: 'Abundance',
                tagline: 'Pay it forward',
                desc: "When you're doing well, this is how you spread it.",
                bg: 'bg-jungle-700/60',
                border: 'border-jungle-500',
              },
            ].map((t) => (
              <div key={t.tier} className={`${t.bg} border ${t.border} rounded-2xl p-6`}>
                <div className="text-3xl mb-3">{t.emoji}</div>
                <h3 className="font-black text-white text-lg mb-1">{t.tier}</h3>
                <p className="text-jungle-400 text-xs font-semibold uppercase tracking-wide mb-2">{t.tagline}</p>
                <p className="text-jungle-300 text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 space-y-2">
            <p className="text-white text-sm font-bold">The price you see is the price you pay. 80% goes to the teacher, 20% platform fee.</p>
            <p className="text-jungle-500 text-sm">No hidden fees. No surprises. Just a clean, honest split.</p>
            <p className="text-jungle-500 text-sm">You can also share any video you own with one friend — on us.</p>
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

      {/* Live sessions */}
      <section className="py-14 px-6 bg-jungle-950 border-t border-jungle-800">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">Want a workout with a little magic in it?</h2>
            <p className="text-jungle-300 text-sm leading-relaxed">Live classes let you move alongside a real guide, ask questions mid-practice, and get the kind of personalization you just can&apos;t get from a recording. Find a class that&apos;s calling your name — and show up.</p>
          </div>
          <Link href="/sessions" className="shrink-0 bg-jungle-900 hover:bg-jungle-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors whitespace-nowrap">
            Join a live class →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
