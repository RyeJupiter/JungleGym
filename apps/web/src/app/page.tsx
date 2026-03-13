import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* Dark jungle hero — nav + hero share the same deep bg */}
      <div className="bg-jungle-900">
        <header className="fixed top-0 inset-x-0 z-50 bg-jungle-900/95 backdrop-blur border-b border-jungle-800">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <span className="font-black text-xl tracking-tight text-white">
              jungle<span className="text-jungle-400">gym</span>
            </span>
            <div className="flex items-center gap-3">
              <Link href="/explore" className="text-sm text-jungle-300 hover:text-white font-medium transition-colors">
                Explore
              </Link>
              <Link href="/auth/login" className="text-sm text-jungle-300 hover:text-white font-medium px-4 py-2 transition-colors">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="bg-earth-400 hover:bg-earth-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Join free
              </Link>
            </div>
          </div>
        </header>

        <section className="pt-44 pb-32 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-block bg-jungle-800 text-jungle-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 tracking-widest uppercase">
              Movement is meant to be joyful
            </div>
            <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-white mb-6 text-balance leading-none">
              Learn from people
              <br />
              <span className="text-jungle-400">who love to move</span>
            </h1>
            <p className="text-lg text-jungle-300 mb-10 max-w-xl mx-auto text-balance leading-relaxed">
              Skill-based videos and live sessions from vetted teachers.
              Every piece gives you something to train today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/explore"
                className="bg-earth-400 hover:bg-earth-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors"
              >
                Explore teachers
              </Link>
              <Link
                href="/apply"
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors border border-white/20"
              >
                Share your practice
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Pricing tiers */}
      <section className="py-20 px-6 bg-jungle-800 text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black mb-3 text-center">Fair, transparent, fun</h2>
          <p className="text-jungle-300 text-center mb-14 max-w-xl mx-auto">
            No dark patterns. Teachers keep the vast majority. You choose what to pay.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                tier: 'Supported',
                desc: 'Minimum price — still get everything. Pay what you can.',
                color: 'bg-jungle-900',
                badge: '~$1/min',
              },
              {
                tier: 'Community',
                desc: "Chip in a little more. You're helping sustain their practice.",
                color: 'bg-jungle-700',
                badge: '~$2/min',
              },
              {
                tier: 'Abundance',
                desc: "You're thriving and want to give back. Creators feel this.",
                color: 'bg-jungle-600',
                badge: '~$3/min',
              },
            ].map((t) => (
              <div key={t.tier} className={`${t.color} rounded-2xl p-6`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">{t.tier}</h3>
                  <span className="bg-white/15 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {t.badge}
                  </span>
                </div>
                <p className="text-jungle-300 text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-jungle-500 text-sm mt-8">
            Prices round to fun numbers: $3.33, $6.66, $9.99, $12.34...
          </p>
        </div>
      </section>

      {/* Live sessions */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-black mb-4 text-jungle-900">Live sessions are gift-based</h2>
            <p className="text-jungle-700 text-lg mb-4 leading-relaxed">
              No minimums. No pressure. Teachers receive{' '}
              <strong className="text-jungle-900">100% of your gift</strong>. A 10% platform tip is
              added on top — and you can adjust it to anything, including zero.
            </p>
            <p className="text-jungle-600 text-sm">
              Real generosity, freely given. That&apos;s the whole vibe.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-jungle-100 shadow-sm">
            <p className="text-xs font-semibold text-jungle-600 mb-1 tracking-widest uppercase">Example gift</p>
            <div className="text-5xl font-black text-jungle-900 mb-5">$20</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-jungle-700">Goes to teacher</span>
                <span className="font-bold text-jungle-900">$20.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-jungle-700">Platform tip (10%, adjustable)</span>
                <span className="font-medium text-jungle-500">$2.00</span>
              </div>
              <div className="border-t border-jungle-100 pt-2 flex justify-between">
                <span className="font-semibold text-jungle-900">You pay</span>
                <span className="font-black text-jungle-900">$22.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center bg-jungle-900 text-white">
        <h2 className="text-4xl font-black mb-4">Ready to play?</h2>
        <p className="text-jungle-400 text-lg mb-8">Join the community. It&apos;s free to start.</p>
        <Link
          href="/auth/signup"
          className="bg-earth-400 hover:bg-earth-500 text-white font-bold px-10 py-4 rounded-xl text-lg inline-block transition-colors"
        >
          Create your account
        </Link>
      </section>
    </div>
  )
}
