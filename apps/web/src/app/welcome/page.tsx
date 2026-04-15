import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'You've been invited — JungleGym',
  description: 'Someone who knows your work sent you here. That means something.',
}

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-jungle-800">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">

          {/* Monkey */}
          <div className="mb-8">
            <div className="w-52 h-52 rounded-full overflow-hidden mx-auto bg-jungle-700 border-4 border-jungle-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/CagedTamarin.jpg/400px-CagedTamarin.jpg"
                alt="Emperor tamarin"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-jungle-500 text-xs italic mt-3">
              Emperor tamarin · <em>Saguinus imperator</em> · public domain
            </p>
          </div>

          <p className="text-xs font-semibold text-jungle-400 uppercase tracking-widest mb-4">
            Personal Invitation
          </p>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            You have been invited<br />
            to the <span className="text-jungle-400">JungleGym.</span>
          </h1>

          <p className="text-lg text-jungle-300 max-w-md mx-auto mb-10 leading-relaxed">
            Someone who knows your work sent you here. That means something.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup"
              className="bg-earth-400 hover:bg-earth-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Join free →
            </Link>
            <Link
              href="/explore"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors border border-white/20"
            >
              Browse first
            </Link>
          </div>
        </div>
      </section>

      {/* What it is */}
      <section className="py-16 px-6 bg-jungle-900">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-jungle-400 uppercase tracking-widest mb-3">What is this place</p>
          <h2 className="text-3xl font-black text-white mb-4">Movement classes from real teachers.</h2>
          <p className="text-jungle-300 text-lg leading-relaxed mb-8">
            Yoga, dance, strength, breathwork, mobility. Buy once, own forever.
            Every dollar goes directly to the teacher — no middleman, no subscriptions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { emoji: '🎬', title: 'Pay once, own it', body: 'No subscriptions. Buy a class and it\'s yours forever.' },
              { emoji: '💸', title: '100% to the teacher', body: 'Every purchase goes straight to the person who made it.' },
              { emoji: '🎁', title: 'Share one friend in', body: 'Every video you own can be shared with one person, on you.' },
            ].map((item) => (
              <div key={item.title} className="bg-jungle-800/60 border border-jungle-700 rounded-2xl p-5">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-bold text-white mb-1">{item.title}</h3>
                <p className="text-jungle-400 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-jungle-800 text-center">
        <div className="max-w-xl mx-auto">
          <div className="text-4xl mb-4">🐒</div>
          <h2 className="text-3xl font-black text-white mb-3">Ready to move?</h2>
          <p className="text-jungle-300 mb-8">Join free. No credit card needed.</p>
          <Link
            href="/auth/signup"
            className="bg-earth-400 hover:bg-earth-500 text-white font-bold px-10 py-4 rounded-xl text-lg inline-block transition-colors"
          >
            Create your account →
          </Link>
        </div>
      </section>
    </div>
  )
}
