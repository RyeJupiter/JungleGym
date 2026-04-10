import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "You're Invited — JungleGym",
  description: "You've been personally invited to co-create on JungleGym. Here's what that means.",
  robots: { index: false, follow: false },
}

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-jungle-900 text-stone-100">
      {/* Nav */}
      <header className="px-6 py-5">
        <Link href="/" className="font-black text-xl text-white">
          jungle<span className="text-jungle-400">gym</span>
        </Link>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-12 pb-20 text-center">
        <div className="flex flex-col items-center mb-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Saguinus_imperator_-_Houston_Zoo.jpg/440px-Saguinus_imperator_-_Houston_Zoo.jpg"
            alt="Emperor tamarin (Saguinus imperator) — known for its magnificent mustache and commanding presence"
            className="w-44 h-auto opacity-75 mix-blend-luminosity rounded-full"
          />
          <p className="text-xs text-jungle-400 mt-3 italic">
            Emperor tamarin · <em>Saguinus imperator</em> · public domain
          </p>
        </div>

        <p className="text-jungle-400 font-semibold tracking-widest text-sm uppercase mb-4">
          Personal invitation
        </p>
        <h1 className="text-5xl sm:text-6xl font-black leading-tight mb-6">
          You've been invited<br />
          to the <span className="text-jungle-400">Jungle</span>.
        </h1>
        <p className="text-xl text-stone-400 leading-relaxed max-w-xl mx-auto">
          Someone who knows your work thinks it belongs here. We do too.
        </p>
      </section>

      {/* Body */}
      <section className="max-w-2xl mx-auto px-6 pb-24 space-y-16 text-lg leading-relaxed text-stone-300">

        <div>
          <p>
            JungleGym exists because the best movement teachers we&apos;ve ever encountered
            were invisible to the people who needed them most. Teaching at festivals. In
            community spaces. In someone&apos;s backyard. Sharing something rare — and having
            nowhere to put it.
          </p>
          <p className="mt-5">
            We built them a stage.
          </p>
        </div>

        <div className="border-l-2 border-jungle-500 pl-6">
          <p className="text-2xl font-bold text-white leading-snug">
            You&apos;re not a content creator here. You&apos;re a movement guide. A lead monkey.
            The difference matters.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white mb-5">How it works for you.</h2>
          <ul className="space-y-4 text-stone-300">
            <li className="flex gap-3">
              <span className="text-jungle-400 font-bold mt-0.5 flex-shrink-0">→</span>
              <span>
                <strong className="text-white">You set your own rates.</strong> We use a
                tiered pricing model — Supported, Community, and Abundance — so students
                can pay what reflects where they&apos;re at. You choose the floor.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-jungle-400 font-bold mt-0.5 flex-shrink-0">→</span>
              <span>
                <strong className="text-white">80% goes directly to you.</strong> Every
                sale. No algorithm deciding who eats. No subscriptions cutting into your
                revenue. Stripe Connect deposits straight to your account.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-jungle-400 font-bold mt-0.5 flex-shrink-0">→</span>
              <span>
                <strong className="text-white">Students buy once, own forever.</strong>{' '}
                No churn. No renewals. People who invest in your work keep it — and come
                back when they&apos;re ready to go deeper.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-jungle-400 font-bold mt-0.5 flex-shrink-0">→</span>
              <span>
                <strong className="text-white">Live sessions, gift-based.</strong> Teach
                live, let students gift freely. 100% of gifts go to you — no platform cut
                on sessions.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-jungle-400 font-bold mt-0.5 flex-shrink-0">→</span>
              <span>
                <strong className="text-white">One free video to start.</strong> Help
                new students discover your work. After that, it&apos;s entirely up to you.
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white mb-5">What we ask of you.</h2>
          <ul className="space-y-3 text-stone-300">
            <li className="flex gap-3">
              <span className="text-jungle-400 font-bold mt-0.5 flex-shrink-0">→</span>
              <span>Only upload what you own or have the rights to share — music included.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-jungle-400 font-bold mt-0.5 flex-shrink-0">→</span>
              <span>Bring your real practice. Not a performance of it.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-jungle-400 font-bold mt-0.5 flex-shrink-0">→</span>
              <span>Treat students the way you&apos;d want to be treated in someone else&apos;s space.</span>
            </li>
          </ul>
        </div>

        <div>
          <p>
            This is a small, vetted community. We&apos;re not trying to be the YouTube of
            fitness. We&apos;re trying to be the place where the right teacher finds the
            right student, and the exchange feels honest.
          </p>
          <p className="mt-5 text-white font-semibold">
            We&apos;re glad you&apos;re here.
          </p>
        </div>

      </section>

      {/* CTA */}
      <section className="border-t border-jungle-800 py-16 px-6 text-center">
        <p className="text-stone-400 mb-2 text-lg">Ready to set up your space?</p>
        <p className="text-stone-500 text-sm mb-8">
          Create an account, then apply to teach. We&apos;ll get you set up from there.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="bg-jungle-500 hover:bg-jungle-400 text-white font-bold px-8 py-4 rounded-xl transition-colors"
          >
            Create your account
          </Link>
          <Link
            href="/apply"
            className="border border-jungle-600 hover:border-jungle-400 text-jungle-300 hover:text-jungle-100 font-bold px-8 py-4 rounded-xl transition-colors"
          >
            Apply to teach
          </Link>
        </div>
        <p className="text-stone-600 text-sm mt-8">
          Questions? Email{' '}
          <a href="mailto:rye@junglegym.academy" className="text-jungle-500 hover:text-jungle-400 underline">
            rye@junglegym.academy
          </a>
        </p>
      </section>
    </div>
  )
}
