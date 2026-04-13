import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

// ── Gorilla SVGs ──────────────────────────────────────────────────────────────
// Left: chilling cross-legged, hands on knees
function GorillaLeft() {
  return (
    <svg viewBox="0 0 130 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-32 xl:w-40 opacity-80">
      {/* Shadow */}
      <ellipse cx="65" cy="196" rx="42" ry="5" fill="#0a1c14" opacity="0.4"/>
      {/* Crossed legs base */}
      <path d="M20 158 Q18 178 65 180 Q112 178 110 158 Q92 148 65 146 Q38 148 20 158Z" fill="#1b4332"/>
      {/* Body */}
      <path d="M32 138 Q28 120 32 102 Q43 88 65 87 Q87 88 98 102 Q102 120 98 138 Q84 147 65 148 Q46 147 32 138Z" fill="#237a51"/>
      {/* Shoulder humps */}
      <ellipse cx="26" cy="108" rx="20" ry="14" fill="#237a51"/>
      <ellipse cx="104" cy="108" rx="20" ry="14" fill="#237a51"/>
      {/* Chest definition */}
      <path d="M42 112 Q65 105 88 112" stroke="#2d9e69" strokeWidth="2" fill="none" opacity="0.5"/>
      {/* Left arm resting on knee */}
      <path d="M18 112 Q10 126 12 148 Q14 160 22 162 Q30 162 32 152 Q33 133 36 116" fill="#237a51"/>
      {/* Right arm resting on knee */}
      <path d="M112 112 Q120 126 118 148 Q116 160 108 162 Q100 162 98 152 Q97 133 94 116" fill="#237a51"/>
      {/* Left hand */}
      <ellipse cx="14" cy="160" rx="11" ry="7" fill="#1b4332" transform="rotate(-12 14 160)"/>
      {/* Right hand */}
      <ellipse cx="116" cy="160" rx="11" ry="7" fill="#1b4332" transform="rotate(12 116 160)"/>
      {/* Neck */}
      <path d="M52 90 Q52 78 65 76 Q78 78 78 90" fill="#237a51"/>
      {/* Head */}
      <ellipse cx="65" cy="57" rx="32" ry="30" fill="#237a51"/>
      {/* Ears */}
      <ellipse cx="35" cy="58" rx="10" ry="9" fill="#237a51"/>
      <ellipse cx="95" cy="58" rx="10" ry="9" fill="#237a51"/>
      {/* Ear canal detail */}
      <ellipse cx="35" cy="58" rx="5" ry="4" fill="#1b4332"/>
      <ellipse cx="95" cy="58" rx="5" ry="4" fill="#1b4332"/>
      {/* Brow ridge */}
      <path d="M37 46 Q65 39 93 46" stroke="#1b4332" strokeWidth="6" fill="none" strokeLinecap="round"/>
      {/* Muzzle */}
      <ellipse cx="65" cy="67" rx="22" ry="19" fill="#1b4332"/>
      {/* Eyes — calm, slightly droopy (chilling) */}
      <circle cx="53" cy="51" r="5" fill="#0a0e0a"/>
      <circle cx="77" cy="51" r="5" fill="#0a0e0a"/>
      <circle cx="55" cy="49" r="2" fill="white" opacity="0.5"/>
      <circle cx="79" cy="49" r="2" fill="white" opacity="0.5"/>
      {/* Half-closed eyelids */}
      <path d="M48 49 Q53 47 58 49" stroke="#1b4332" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M72 49 Q77 47 82 49" stroke="#1b4332" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* Nostrils */}
      <circle cx="59" cy="65" r="3.5" fill="#0a0e0a"/>
      <circle cx="71" cy="65" r="3.5" fill="#0a0e0a"/>
      {/* Relaxed content smile */}
      <path d="M54 75 Q65 82 76 75" stroke="#0a0e0a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Arm muscle hint */}
      <path d="M12 132 Q15 122 20 116" stroke="#2d9e69" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
      <path d="M118 132 Q115 122 110 116" stroke="#2d9e69" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

// Right: seated, one arm raised in casual flex, slight grin
function GorillaRight() {
  return (
    <svg viewBox="0 0 130 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-32 xl:w-40 opacity-80 scale-x-[-1]">
      {/* Shadow */}
      <ellipse cx="65" cy="196" rx="42" ry="5" fill="#0a1c14" opacity="0.4"/>
      {/* Sitting legs */}
      <path d="M20 152 Q18 172 65 174 Q112 172 110 152 Q92 143 65 141 Q38 143 20 152Z" fill="#1b4332"/>
      {/* Body */}
      <path d="M30 132 Q26 114 30 96 Q42 82 65 81 Q88 82 100 96 Q104 114 100 132 Q86 141 65 143 Q44 141 30 132Z" fill="#237a51"/>
      {/* Shoulder humps */}
      <ellipse cx="24" cy="102" rx="18" ry="13" fill="#237a51"/>
      <ellipse cx="106" cy="96" rx="22" ry="16" fill="#237a51"/>
      {/* Chest */}
      <path d="M40 106 Q65 99 90 106" stroke="#2d9e69" strokeWidth="2" fill="none" opacity="0.5"/>
      {/* Left arm — relaxed at side */}
      <path d="M18 108 Q10 122 12 142 Q14 154 22 156 Q30 156 32 146 Q33 128 36 112" fill="#237a51"/>
      {/* Left hand */}
      <ellipse cx="14" cy="154" rx="11" ry="7" fill="#1b4332" transform="rotate(-10 14 154)"/>
      {/* Right arm — RAISED flex */}
      <path d="M106 94 Q116 76 110 56 Q105 44 97 48 Q89 53 94 65 Q98 76 96 88" fill="#237a51"/>
      {/* Bicep peak */}
      <ellipse cx="110" cy="72" rx="10" ry="14" fill="#2d9e69" transform="rotate(20 110 72)"/>
      {/* Forearm */}
      <path d="M96 88 Q92 98 97 108 Q102 116 110 110 Q116 103 110 94" fill="#237a51"/>
      {/* Fist */}
      <ellipse cx="106" cy="113" rx="9" ry="8" fill="#1b4332"/>
      {/* Knuckle lines */}
      <path d="M100 110 Q106 108 112 111" stroke="#237a51" strokeWidth="1" fill="none"/>
      {/* Neck */}
      <path d="M52 84 Q52 72 65 70 Q78 72 78 84" fill="#237a51"/>
      {/* Head — slight tilt toward raised arm */}
      <ellipse cx="67" cy="49" rx="30" ry="28" fill="#237a51" transform="rotate(5 67 49)"/>
      {/* Ears */}
      <ellipse cx="37" cy="50" rx="9" ry="8" fill="#237a51"/>
      <ellipse cx="97" cy="49" rx="9" ry="8" fill="#237a51"/>
      <ellipse cx="37" cy="50" rx="5" ry="4" fill="#1b4332"/>
      <ellipse cx="97" cy="49" rx="5" ry="4" fill="#1b4332"/>
      {/* Brow — one raised (smug) */}
      <path d="M39 38 Q67 31 93 38" stroke="#1b4332" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M74 34 Q84 30 92 34" stroke="#1b4332" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* Muzzle */}
      <ellipse cx="67" cy="59" rx="21" ry="18" fill="#1b4332"/>
      {/* Eyes */}
      <circle cx="55" cy="44" r="4.5" fill="#0a0e0a"/>
      <circle cx="78" cy="43" r="4.5" fill="#0a0e0a"/>
      <circle cx="57" cy="42" r="1.8" fill="white" opacity="0.5"/>
      <circle cx="80" cy="41" r="1.8" fill="white" opacity="0.5"/>
      {/* Nostrils */}
      <circle cx="61" cy="58" r="3.5" fill="#0a0e0a"/>
      <circle cx="73" cy="58" r="3.5" fill="#0a0e0a"/>
      {/* Smug grin */}
      <path d="M55 68 Q67 76 77 70" stroke="#0a0e0a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Teeth hint */}
      <path d="M58 68 Q67 74 74 70" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.3"/>
    </svg>
  )
}

export default async function HomePage() {
  return (
    <div className="min-h-screen">

      <Navbar />

      {/* Hero */}
      <div className="bg-jungle-800">
        <section className="pt-28 pb-24 px-6 text-center relative overflow-hidden">

          {/* Gorilla decorations */}
          <div className="hidden lg:block absolute left-4 xl:left-10 bottom-0 pointer-events-none select-none">
            <GorillaLeft />
          </div>
          <div className="hidden lg:block absolute right-4 xl:right-10 bottom-0 pointer-events-none select-none">
            <GorillaRight />
          </div>

          <div className="max-w-3xl mx-auto relative z-10">
            <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-white mb-6 leading-none" style={{ textShadow: '-1px -1px 0 rgba(0,0,0,0.25), 1px -1px 0 rgba(0,0,0,0.25), -1px 1px 0 rgba(0,0,0,0.25), 1px 1px 0 rgba(0,0,0,0.25)' }}>
              Welcome to JungleGym.
              <br />
              <span className="block mt-3 text-jungle-400">Let&apos;s learn &amp; play.</span>
            </h1>
            <p className="text-lg text-jungle-300 mb-10 max-w-xl mx-auto leading-relaxed">
              Movement classes from skilled guides.
              Every class leaves you with something your body didn't have before.
            </p>
            {/* Tag pills — one row, content categories */}
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {[
                ['yoga',       '🧘', 'yoga'],
                ['strength',   '💪', 'strength'],
                ['mobility',   '🌀', 'mobility'],
                ['breathwork', '🌬️', 'breathwork'],
                ['dance',      '💃', 'dance'],
                ['kettlebell', '🔔', 'kettlebell'],
              ].map(([slug, emoji, label]) => (
                <Link
                  key={slug}
                  href={`/classes?tag=${slug}`}
                  className="flex items-center gap-1.5 bg-jungle-700/40 hover:bg-jungle-600/60 border border-jungle-500/40 hover:border-jungle-400/80 text-jungle-200 hover:text-white px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                >
                  <span className="text-base leading-none">{emoji}</span>
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
              { emoji: '🔍', title: 'Find a teacher', body: 'Browse by style — yoga, kettlebell, mobility, breathwork, and more.', href: '/classes' },
              { emoji: '🎬', title: 'Watch & train', body: 'Buy videos from curated guides. 80% to the teacher, 20% to JungleGym.', href: '/classes' },
              { emoji: '🎁', title: 'Join live sessions', body: 'Real-time classes, gift-based.', href: '/sessions' },
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
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-jungle-500 uppercase tracking-widest mb-3">Radical Transparency</p>
            <h2 className="text-4xl font-black text-stone-900 mb-3">Here&apos;s how the money flows.</h2>
            <p className="text-stone-600 max-w-xl mx-auto text-lg">
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
                bg: 'bg-stone-50',
                border: 'border-stone-200',
              },
              {
                emoji: '🌿',
                tier: 'Community',
                tagline: 'The sweet spot',
                desc: "Sustaining someone's practice. The tier most people choose.",
                bg: 'bg-jungle-50',
                border: 'border-jungle-200',
              },
              {
                emoji: '🌳',
                tier: 'Abundance',
                tagline: 'Pay it forward',
                desc: "When you're doing well, this is how you spread it.",
                bg: 'bg-jungle-100',
                border: 'border-jungle-300',
              },
            ].map((t) => (
              <div key={t.tier} className={`${t.bg} border ${t.border} rounded-2xl p-6`}>
                <div className="text-3xl mb-3">{t.emoji}</div>
                <h3 className="font-black text-stone-900 text-lg mb-1">{t.tier}</h3>
                <p className="text-jungle-600 text-xs font-semibold uppercase tracking-wide mb-2">{t.tagline}</p>
                <p className="text-stone-600 text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 space-y-2">
            <p className="text-stone-800 text-sm font-bold">The price you see is the price you pay. 80% goes to the teacher, 20% platform fee.</p>
            <p className="text-stone-500 text-sm">No hidden fees. No surprises. Just a clean, honest split.</p>
            <p className="text-stone-500 text-sm">You can also share any video you own with one friend — on us.</p>
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
      <section className="py-14 px-6 bg-stone-50 border-t border-stone-200">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-stone-900 mb-1">Want a workout with a little magic in it?</h2>
            <p className="text-stone-600 text-sm leading-relaxed">Live classes let you move alongside a real guide, ask questions mid-practice, and get the kind of personalization you just can&apos;t get from a recording. Find a class that&apos;s calling your name — and show up.</p>
          </div>
          <Link href="/sessions" className="shrink-0 bg-jungle-800 hover:bg-jungle-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors whitespace-nowrap">
            Join a live class →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
