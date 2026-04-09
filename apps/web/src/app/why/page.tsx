import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Why the Jungle Exists – JungleGym',
  description:
    'Physical movement is one of the most powerful things we can offer each other. Not as exercise. As transmission.',
}

export default function WhyPage() {
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
            src="https://upload.wikimedia.org/wikipedia/commons/5/52/Brehms_Het_Leven_der_DIeren_Orde_1_Lar_%28Hylobates_lar%29.jpg"
            alt="White-handed gibbon (Hylobates lar) — Brehm's Life of Animals, 19th century"
            className="w-52 h-auto opacity-70 mix-blend-luminosity"
          />
          <p className="text-xs text-jungle-400 mt-3 italic">
            White-handed gibbon · <em>Hylobates lar</em> · Brehm&apos;s Life of Animals, c. 1880 · public domain
          </p>
        </div>

        <h1 className="text-5xl sm:text-6xl font-black leading-tight mb-6">
          Why the<br />
          <span className="text-jungle-400">Jungle</span> exists.
        </h1>
        <p className="text-xl text-stone-400 leading-relaxed max-w-xl mx-auto">
          Physical Education was supposed to be the place where we learned to inhabit our
          bodies with joy. It became something else.
        </p>
      </section>

      {/* Manifesto */}
      <section className="max-w-2xl mx-auto px-6 pb-24 space-y-16 text-lg leading-relaxed text-stone-300">

        <div>
          <p>
            The best teachers I&apos;ve met weren&apos;t in a gym. They were at festivals, in community
            spaces, in someone&apos;s backyard. The yogi who learned from a lineage. The contact
            dancer who can make you forget gravity. The breathwork guide who held you through
            the kind of release you didn&apos;t know you needed.
          </p>
          <p className="mt-5">
            They were teaching anyone who showed up — often for free — because nobody had
            built them a stage.
          </p>
        </div>

        <div className="border-l-2 border-jungle-500 pl-6">
          <p className="text-2xl font-bold text-white leading-snug">
            "Liquidate Physical Education. Replace the standardized, joyless model with vetted
            teachers sharing what they love, students choosing what moves them, money flowing
            directly to the source."
          </p>
        </div>

        <div>
          <p>
            That&apos;s the mission. Not fitness. Not wellness. Not content. Movement as
            transmission — from a body that knows, to a body that&apos;s ready to learn.
          </p>
          <p className="mt-5">
            I pulled all-nighters building this because I believe it matters. Because I&apos;ve
            felt what happens in a room when the right teacher shows up. Because I&apos;ve watched
            communities come alive around shared physical practice. And because I got tired of
            those teachers being invisible to the people who needed them most.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white mb-4">The deal is simple.</h2>
          <ul className="space-y-3 text-stone-300">
            <li className="flex gap-3">
              <span className="text-jungle-400 font-bold mt-0.5">→</span>
              <span>Teachers apply. We vet them. They set their own rates.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-jungle-400 font-bold mt-0.5">→</span>
              <span>You find something that calls to you. You pay once. You own it forever.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-jungle-400 font-bold mt-0.5">→</span>
              <span>80% goes directly to the teacher. No algorithms deciding who eats.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-jungle-400 font-bold mt-0.5">→</span>
              <span>You can share access with one person you love. That&apos;s it.</span>
            </li>
          </ul>
        </div>

        <div>
          <p>
            The Jungle isn&apos;t a subscription. It&apos;s not a platform optimizing for watch time.
            It&apos;s a place where the exchange is honest — you give your attention and your
            dollars to someone who earned it, and you walk away with something that lives
            in your body.
          </p>
          <p className="mt-5 text-white font-semibold">
            That&apos;s worth building. That&apos;s worth returning to.
          </p>
        </div>

      </section>

      {/* CTA */}
      <section className="border-t border-jungle-800 py-16 px-6 text-center">
        <p className="text-stone-400 mb-6 text-lg">Ready to move?</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/explore"
            className="bg-jungle-500 hover:bg-jungle-400 text-white font-bold px-8 py-4 rounded-xl transition-colors"
          >
            Explore classes
          </Link>
          <Link
            href="/apply"
            className="border border-jungle-600 hover:border-jungle-400 text-jungle-300 hover:text-jungle-100 font-bold px-8 py-4 rounded-xl transition-colors"
          >
            Teach here
          </Link>
        </div>
        <p className="text-xs text-stone-600 mt-10 italic">
          White-handed gibbon · <em>Hylobates lar</em> · Brehm&apos;s Life of Animals, c. 1880 · public domain
        </p>
      </section>
    </div>
  )
}
