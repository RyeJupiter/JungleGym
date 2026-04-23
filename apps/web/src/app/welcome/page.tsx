import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'You have been invited to the Jungle',
  description: 'A personal invitation to teach on JungleGym.',
  robots: { index: false, follow: false },
}

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Nav — kept minimal to match the invitation feel */}
      <header className="px-4 sm:px-6 py-5 border-b border-stone-100">
        <Link href="/" className="font-black text-xl text-jungle-900">
          jungle<span className="text-jungle-500">gym</span>
        </Link>
      </header>

      {/* Hero — vintage illustration + invitation headline, matching /why's rhythm */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-16 text-center">
        <div className="flex flex-col items-center mb-10 sm:mb-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/emperor-tamarin.jpg"
            alt="Head of an emperor tamarin (Saguinus imperator) — 1907 illustration by E. A. Goeldi"
            className="w-40 sm:w-52 h-auto opacity-80 mix-blend-multiply"
          />
          <p className="text-xs text-stone-400 mt-3 italic">
            Emperor tamarin · <em>Saguinus imperator</em> · Goeldi, 1907
          </p>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6 text-stone-900">
          You&rsquo;ve been invited<br />
          to the <span className="text-jungle-600">Jungle</span>.
        </h1>
        <p className="text-lg sm:text-xl text-stone-500 leading-relaxed max-w-xl mx-auto">
          Someone who knows your teaching sent you here. That means something.
        </p>
      </section>

      {/* Mission + the deal + the ask, read as one quiet flow */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 space-y-12 sm:space-y-16 text-base sm:text-lg leading-relaxed text-stone-600">
        <div>
          <p>
            The best movement teachers we know aren&rsquo;t on YouTube. They&rsquo;re at festivals,
            in community spaces, in someone&rsquo;s backyard — carrying something real, with
            nowhere to put it.
          </p>
          <p className="mt-5 text-stone-900 font-semibold">
            JungleGym is the stage we built for them. For you.
          </p>
        </div>

        {/* Mission quote — same treatment as /why */}
        <div className="border-l-2 border-jungle-500 pl-4 sm:pl-6">
          <p className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
            &ldquo;Liquidate Physical Education. Replace the standardized, joyless model with
            vetted teachers sharing what they love, students choosing what moves them, money
            flowing directly to the source.&rdquo;
          </p>
        </div>

        <div>
          <p>
            Movement as transmission — from a body that knows, to a body that&rsquo;s ready to
            learn. Not fitness. Not wellness. Not content.
          </p>
          <p className="mt-5">
            You&rsquo;re not a content creator here. You&rsquo;re a movement guide. A lead
            monkey. Everything downstream — the rates, the ownership, the way the money
            moves — follows from that.
          </p>
        </div>

        {/* The deal — four tight lines instead of five sprawling ones */}
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 mb-5">
            Here&rsquo;s what you get.
          </h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-jungle-500 font-bold mt-0.5 flex-shrink-0">→</span>
              <span>Your own treehouse — a creator profile you shape.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-jungle-500 font-bold mt-0.5 flex-shrink-0">→</span>
              <span>Three price tiers you set: Supported, Community, Abundance.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-jungle-500 font-bold mt-0.5 flex-shrink-0">→</span>
              <span>80% of every sale, paid directly into your account.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-jungle-500 font-bold mt-0.5 flex-shrink-0">→</span>
              <span>Students buy once and own it forever. Live sessions are gift-based — 100% to you.</span>
            </li>
          </ul>
        </div>

        {/* The ask — shortened to a single beat */}
        <div>
          <p className="text-stone-900 font-semibold mb-2">What we ask in return:</p>
          <p>
            Upload only what&rsquo;s yours, bring your real practice (not a performance of it),
            and treat students the way you&rsquo;d want to be treated in someone else&rsquo;s
            space.
          </p>
        </div>
      </section>

      {/* CTA — dark jungle, mission-tied */}
      <section className="bg-jungle-900 text-center px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-2xl mx-auto">
          <p className="text-jungle-300 font-semibold mb-2 text-base sm:text-lg">
            Glad you&rsquo;re here.
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            Ready to build your treehouse?
          </h2>
          <p className="text-jungle-400 mb-8 sm:mb-10 text-sm sm:text-base">
            Create an account, then apply to teach. We&rsquo;ll take it from there.
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
