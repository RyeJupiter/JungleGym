import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'You have been invited to the JungleGym',
  description: 'A personal invitation to co-create on JungleGym.',
  robots: { index: false, follow: false },
}

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">

      {/* Nav */}
      <header className="px-4 sm:px-6 py-5 bg-white border-b border-stone-100">
        <Link href="/" className="font-black text-xl text-jungle-900">
          jungle<span className="text-jungle-500">gym</span>
        </Link>
      </header>

      {/* Hero — jungle green */}
      <section className="relative bg-jungle-800 overflow-hidden">
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-14 sm:pb-20 text-center">
          <div className="flex flex-col items-center mb-8 sm:mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/emperor-tamarin.jpg"
              alt="Emperor tamarin — Saguinus imperator"
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover shadow-md border-4 border-jungle-600"
            />
            <p className="text-xs text-jungle-400 mt-3 italic">
              Emperor tamarin · <em>Saguinus imperator</em> · public domain
            </p>
          </div>

          <p className="text-jungle-400 font-semibold tracking-widest text-xs uppercase mb-4">
            Personal invitation
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight text-white mb-6">
            You have been invited<br />
            to the <span className="text-jungle-400">JungleGym</span>.
          </h1>
          <p className="text-base sm:text-lg text-jungle-300 leading-relaxed max-w-lg mx-auto">
            Someone who knows your work sent you here. That means something.
          </p>
        </div>
      </section>

      {/* Section 1 — warm white, jungle text */}
      <section className="bg-white border-t border-stone-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-6 text-base sm:text-lg leading-relaxed text-stone-600">
          <p>
            The best movement teachers we know aren&apos;t on YouTube. They&apos;re at festivals,
            in community spaces, in someone&apos;s backyard — sharing something real, with
            nowhere to put it.
          </p>
          <p className="text-jungle-800 font-semibold text-lg sm:text-xl">
            JungleGym is the stage we built for them. For you.
          </p>
          <p>
            Not a subscription platform. Not a fitness app. A place where the exchange is
            honest — you bring your practice, students come ready to learn, and money flows
            directly to the source.
          </p>
        </div>
      </section>

      {/* Blockquote — amber warmth */}
      <section className="bg-amber-50 border-t border-b border-amber-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="border-l-4 border-amber-400 pl-5 sm:pl-7">
            <p className="text-xl sm:text-2xl font-bold text-amber-900 leading-snug">
              You&apos;re not a content creator here.<br />
              You&apos;re a movement guide. A lead monkey.<br />
              The difference matters.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 — the deal, stone bg */}
      <section className="bg-stone-100 border-t border-stone-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-xl sm:text-2xl font-black text-stone-800 mb-6 sm:mb-8">Here is how it works.</h2>
          <ul className="space-y-6">
            <li className="flex gap-4">
              <span className="text-jungle-600 font-black text-lg mt-0.5 flex-shrink-0">→</span>
              <div>
                <p className="font-bold text-stone-800">You set your own rates.</p>
                <p className="text-stone-500 mt-1">
                  Three tiers — Supported, Community, Abundance. You set the floor.
                  Students pay what reflects where they are.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="text-amber-600 font-black text-lg mt-0.5 flex-shrink-0">→</span>
              <div>
                <p className="font-bold text-stone-800">80% of every sale goes straight to you.</p>
                <p className="text-stone-500 mt-1">
                  Stripe Connect deposits directly into your account. No algorithm
                  deciding who eats this month.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="text-jungle-600 font-black text-lg mt-0.5 flex-shrink-0">→</span>
              <div>
                <p className="font-bold text-stone-800">Students buy once, own it forever.</p>
                <p className="text-stone-500 mt-1">
                  No churn. No renewals. People who invest in your work keep it and
                  come back when they are ready for more.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="text-amber-600 font-black text-lg mt-0.5 flex-shrink-0">→</span>
              <div>
                <p className="font-bold text-stone-800">Live sessions, gift-based. 100% to you.</p>
                <p className="text-stone-500 mt-1">
                  Teach live. Let students give freely. JungleGym takes nothing on
                  session gifts.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="text-jungle-600 font-black text-lg mt-0.5 flex-shrink-0">→</span>
              <div>
                <p className="font-bold text-stone-800">Start with one free video.</p>
                <p className="text-stone-500 mt-1">
                  Let new students find you. After that, everything is on your terms.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3 — what we ask, back to white */}
      <section className="bg-white border-t border-stone-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-xl sm:text-2xl font-black text-stone-800 mb-5 sm:mb-6">What we ask.</h2>
          <ul className="space-y-4 text-stone-600 text-base sm:text-lg leading-relaxed">
            <li className="flex gap-3">
              <span className="text-stone-400 font-bold mt-0.5 flex-shrink-0">—</span>
              <span>Only upload what you own or have the rights to share — music included.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-stone-400 font-bold mt-0.5 flex-shrink-0">—</span>
              <span>Bring your real practice. Not a performance of it.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-stone-400 font-bold mt-0.5 flex-shrink-0">—</span>
              <span>Treat students the way you would want to be treated in someone else&apos;s space.</span>
            </li>
          </ul>
          <p className="mt-8 text-stone-500 text-base">
            This is a small, vetted community. We are not trying to be the YouTube of
            fitness. We are trying to be the place where the right teacher finds the
            right student.
          </p>
        </div>
      </section>

      {/* CTA — dark jungle, full contrast */}
      <section className="relative bg-jungle-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-jungle-300 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-amber-300 blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <p className="text-jungle-300 font-semibold mb-2 text-base sm:text-lg">
            Glad you are here.
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            Ready to set up your space?
          </h2>
          <p className="text-jungle-400 mb-8 sm:mb-10 text-sm sm:text-base">
            Create an account, then apply to teach. We will get you from there.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-sm sm:max-w-none mx-auto">
            <Link
              href="/auth/signup"
              className="bg-jungle-400 hover:bg-jungle-300 text-jungle-950 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-colors"
            >
              Create your account
            </Link>
            <Link
              href="/apply"
              className="border border-jungle-600 hover:border-jungle-400 text-jungle-300 hover:text-jungle-100 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-colors"
            >
              Apply to teach
            </Link>
          </div>
          <p className="text-jungle-600 text-sm mt-10">
            Questions?{' '}
            <a href="mailto:rye@junglegym.academy" className="text-jungle-500 hover:text-jungle-400 underline">
              rye@junglegym.academy
            </a>
          </p>
        </div>
      </section>

    </div>
  )
}
