import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JungleGym at Festivals',
  description:
    'JungleGym brings a full movement space to conscious festivals — jungle bars, gymnastic rings, acro mats, live music, and men\'s work. Come move. Come play.',
  alternates: { canonical: '/festivals' },
  openGraph: {
    title: 'JungleGym at Festivals',
    description:
      'A full movement space at festivals — bars, rings, mats, music. Open to everyone. Held with care.',
    url: '/festivals',
  },
}

export default function FestivalsPage() {
  return (
    <div className="min-h-screen bg-jungle-900">

      {/* Hero */}
      <section className="pt-20 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-jungle-400 uppercase tracking-widest mb-4">
            JungleGym in the field
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-6 leading-[1.05] sm:leading-none">
            A space to move.<br />
            <span className="text-jungle-400">A space to play.</span>
          </h1>
          <p className="text-lg sm:text-xl text-jungle-300 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10">
            We build a full movement space at festivals — bars, rings, mats, music, and people who
            know how to use all of it. Open to everyone. Held with care.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm sm:max-w-none mx-auto">
            <a
              href="#the-space"
              className="bg-earth-400 hover:bg-earth-500 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg transition-colors"
            >
              See what we bring ↓
            </a>
            <a
              href="#partner"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg transition-colors border border-white/20"
            >
              Bring us to your festival
            </a>
          </div>
        </div>
      </section>

      {/* The space */}
      <section id="the-space" className="py-14 sm:py-20 px-4 sm:px-6 bg-jungle-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs font-semibold text-jungle-400 uppercase tracking-widest mb-3">What we set up</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">The JungleGym space.</h2>
            <p className="text-jungle-300 text-base sm:text-lg max-w-2xl mx-auto">
              We build it, we hold it, we keep it good. You show up and move.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {[
              {
                emoji: '🏗️',
                title: 'Calisthenics equipment',
                body: 'Jungle bars, gymnastic rings, and rigging — the real stuff. Pull-ups, muscle-ups, skin-the-cats, L-sits, hangs. Come test yourself or just hang around.',
              },
              {
                emoji: '🤸',
                title: 'Acro & movement mats',
                body: 'Foam crash mats for acro yoga, partner flows, tumbling, and anything else your body decides to try. Soft landing guaranteed.',
              },
              {
                emoji: '🎧',
                title: 'Live DJ music',
                body: 'Friends on the decks — techno, house, bass music. The kind of music that makes your body want to move before your brain agrees. The space has a soundtrack.',
              },
              {
                emoji: '🛡️',
                title: 'Someone holding the space',
                body: 'There\'s always a person tending the space — watching for safety, keeping the vibe right, welcoming newcomers, and making sure the energy stays clean and good.',
              },
            ].map((card) => (
              <div key={card.title} className="bg-jungle-700/60 border border-jungle-600 rounded-2xl p-5 sm:p-7">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{card.emoji}</div>
                <h3 className="font-black text-white text-lg mb-2">{card.title}</h3>
                <p className="text-jungle-300 text-sm leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Men's work */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-jungle-900">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <p className="text-xs font-semibold text-jungle-400 uppercase tracking-widest mb-3">By invitation</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-5">Men&apos;s work.</h2>
              <p className="text-jungle-300 text-base sm:text-lg leading-relaxed mb-5">
                Sometimes we close the space. Not to exclude — to create room.
              </p>
              <p className="text-jungle-300 leading-relaxed mb-5">
                Men&apos;s work sessions are closed circles where we talk about the things that don&apos;t
                always get talked about: brotherhood, accountability, how to look out for one another.
                Anger and where it lives. Discipline that comes from love, not fear.
                How to celebrate other men without making it weird.
              </p>
              <p className="text-jungle-300 leading-relaxed">
                We work out. We sit. We speak honestly. We leave better than we came.
              </p>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {[
                { emoji: '🤝', label: 'Brotherhood & community' },
                { emoji: '⚓', label: 'Accountability & anchorship' },
                { emoji: '🔥', label: 'Healthy anger & emotional range' },
                { emoji: '🏋️', label: 'Discipline & physical practice' },
                { emoji: '🎉', label: 'How to celebrate one another' },
                { emoji: '👁️', label: 'Watching out for each other' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 sm:gap-4 bg-jungle-800/60 border border-jungle-700 rounded-xl px-4 sm:px-5 py-3 sm:py-4">
                  <span className="text-xl sm:text-2xl">{item.emoji}</span>
                  <span className="text-white font-semibold text-sm sm:text-base">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The vibe / values */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs font-semibold text-jungle-500 uppercase tracking-widest mb-3">The vibe</p>
            <h2 className="text-3xl sm:text-4xl font-black text-jungle-900 mb-4">Open, grounded, alive.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                emoji: '🌿',
                title: 'All levels welcome',
                body: 'Never touched a ring before? Perfect. The space is for everyone — beginners find their first pull-up, advanced athletes find their next challenge, and everyone finds something.',
              },
              {
                emoji: '🔒',
                title: 'Safety taken seriously',
                body: 'A liability waiver keeps everyone honest. Someone is always watching the rigging and the mats. We play hard and we play safe — those aren\'t opposites.',
              },
              {
                emoji: '🎵',
                title: 'Music that moves you',
                body: 'The bass is intentional. Movement is easier when the music is right. We keep the sound dialed so that the space has energy even when it\'s quiet between sets.',
              },
            ].map((card) => (
              <div key={card.title} className="bg-white border border-jungle-100 rounded-2xl p-5 sm:p-7">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{card.emoji}</div>
                <h3 className="font-black text-jungle-900 text-lg mb-2">{card.title}</h3>
                <p className="text-jungle-600 text-sm leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monkey see CTA */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-jungle-800 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-4xl sm:text-5xl mb-5 sm:mb-6">🐒</div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Monkey see. Monkey do.</h2>
          <p className="text-jungle-300 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
            Mimicry is how bodies learn. Watch someone do something your body didn&apos;t think it could —
            and suddenly it can. That&apos;s what the space is for.
            That&apos;s what JungleGym is for.
          </p>
          <Link
            href="/explore"
            className="bg-earth-400 hover:bg-earth-500 text-white font-bold px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg inline-block transition-colors"
          >
            Explore movement classes →
          </Link>
        </div>
      </section>

      {/* Partner CTA */}
      <section id="partner" className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold text-jungle-500 uppercase tracking-widest mb-3">Festival organizers</p>
          <h2 className="text-3xl sm:text-4xl font-black text-jungle-900 mb-4">Want this at your festival?</h2>
          <p className="text-jungle-600 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
            We bring the equipment, the music, the people who know how to hold a space.
            You bring the field. Let&apos;s build something worth coming back to.
          </p>
          <a
            href="mailto:hello@junglegym.academy?subject=Festival partnership"
            className="bg-jungle-900 hover:bg-jungle-800 text-white font-bold px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg inline-block transition-colors break-all"
          >
            hello@junglegym.academy →
          </a>
        </div>
      </section>

    </div>
  )
}
