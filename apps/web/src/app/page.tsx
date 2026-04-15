import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ParallaxForest } from '@/components/ParallaxForest'

const WELCOME_VIDEO_ID = '6beae5fe-eb48-4caa-9e39-4e35452bf50f'

// Pin specific session IDs here to feature them on the homepage.
// Leave empty to automatically show the next 3 upcoming sessions.
const PINNED_SESSION_IDS: string[] = []

// ── Public-domain natural history illustrations (Wikimedia Commons) ───────────
// Orangutan engraving, Wellcome Collection 1658 — CC BY 4.0
// Chimpanzee head study, Joseph Schippers 1894, Rijksmuseum — CC0
// Chimpanzee natural history, Philip Henry Gosse 1848 — public domain
const IMG_LEFT  = "https://upload.wikimedia.org/wikipedia/commons/2/2e/Engraving_of_a_orangutan_Wellcome_L0032838.jpg"
const IMG_RIGHT = "https://upload.wikimedia.org/wikipedia/commons/5/53/Kop_van_een_jonge_chimpansee%2C_RP-1913-2832.jpg"
const IMG_MONKEY_SECTION = "https://upload.wikimedia.org/wikipedia/commons/e/e6/Chimpanzee_Natural_Histpry_1848.jpg"

function GorillaLeft() {
  return (
    <img
      src={IMG_LEFT}
      alt="Orangutan — engraving, Wellcome Collection (public domain)"
      className="w-36 xl:w-52 h-auto invert mix-blend-screen opacity-35"
    />
  )
}

function GorillaRight() {
  return (
    <img
      src={IMG_RIGHT}
      alt="Chimpanzee — etching, Rijksmuseum (public domain)"
      className="w-36 xl:w-52 h-auto invert mix-blend-screen opacity-35"
    />
  )
}

// ── MonkeyOnBranch SVG palette (philosophy section) ──────────────────────────
const K = "#c49660"
const D = "#9a7240"

// Wide landscape plate: monkey on a branch. After 19th-c. natural history engravings.
function MonkeyOnBranch() {
  return (
    <svg viewBox="0 0 400 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full max-w-sm opacity-55">
      {/* === BRANCH === */}
      <path d="M0 112 C50 106 100 100 150 103 C200 106 240 99 290 96 C330 93 360 94 400 98" stroke={K} strokeWidth="9" fill="none" strokeLinecap="round"/>
      <path d="M10 111 C60 106 110 101 160 104" stroke={D} strokeWidth="1" fill="none" opacity="0.45"/>
      <path d="M170 103 C220 100 260 97 300 95" stroke={D} strokeWidth="1" fill="none" opacity="0.4"/>
      <path d="M10 115 C60 110 120 105 170 108" stroke={D} strokeWidth="0.7" fill="none" opacity="0.4"/>
      {/* bark texture */}
      <path d="M60 108 L58 114" stroke={D} strokeWidth="0.6" opacity="0.4"/><path d="M90 106 L88 112" stroke={D} strokeWidth="0.6" opacity="0.4"/>
      <path d="M200 103 L198 109" stroke={D} strokeWidth="0.6" opacity="0.4"/><path d="M340 96 L338 102" stroke={D} strokeWidth="0.6" opacity="0.4"/>
      {/* small side branches */}
      <path d="M110 102 C105 88 108 74 114 65" stroke={K} strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M113 102 C108 89 111 76 117 67" stroke={D} strokeWidth="0.8" fill="none" opacity="0.4"/>
      <path d="M330 95 C335 80 338 65 332 55" stroke={K} strokeWidth="3.8" fill="none" strokeLinecap="round"/>
      <path d="M333 95 C338 81 341 67 335 57" stroke={D} strokeWidth="0.8" fill="none" opacity="0.4"/>
      {/* === FOLIAGE === */}
      {/* left branch leaves */}
      <path d="M114 65 C108 54 98 50 92 57 C86 64 92 74 102 72 C110 70 114 65 114 65 Z" stroke={K} strokeWidth="1.2" fill={`${K}0a`}/>
      <path d="M114 65 C120 54 130 48 138 54 C146 60 144 72 134 74 C124 76 116 66 114 65 Z" stroke={K} strokeWidth="1.2" fill={`${K}0a`}/>
      <path d="M114 65 C110 52 116 40 126 38 C136 36 142 46 136 55" stroke={K} strokeWidth="1.1" fill={`${K}08`}/>
      <path d="M96 60 C100 65 106 70 112 70" stroke={D} strokeWidth="0.5" fill="none" opacity="0.5"/>
      <path d="M126 50 C126 57 128 64 132 68" stroke={D} strokeWidth="0.5" fill="none" opacity="0.5"/>
      {/* right branch leaves */}
      <path d="M332 55 C326 44 314 40 308 47 C302 54 308 64 318 62 C328 60 332 55 332 55 Z" stroke={K} strokeWidth="1.2" fill={`${K}0a`}/>
      <path d="M332 55 C338 44 350 38 358 44 C366 50 364 62 354 64 C344 66 334 56 332 55 Z" stroke={K} strokeWidth="1.2" fill={`${K}0a`}/>
      <path d="M316 48 C320 54 326 60 330 60" stroke={D} strokeWidth="0.5" fill="none" opacity="0.5"/>
      <path d="M346 40 C346 48 348 55 352 59" stroke={D} strokeWidth="0.5" fill="none" opacity="0.5"/>
      {/* === MONKEY (center-right, perched ~x 205-240) === */}
      {/* tail - long, hanging and curling */}
      <path d="M232 100 C236 116 240 132 246 142 C252 152 262 154 267 146 C272 136 266 122 254 118" stroke={K} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M234 102 C238 116 242 132 248 142" stroke={D} strokeWidth="0.7" fill="none" opacity="0.4"/>
      {/* haunches/hind legs on branch */}
      <path d="M210 100 C206 106 205 115 210 119 C216 123 224 121 226 114 C228 107 222 100 216 98" stroke={K} strokeWidth="1.4" fill={`${K}0e`}/>
      <path d="M228 98 C234 103 236 112 231 117 C226 122 218 120 216 114" stroke={K} strokeWidth="1.4" fill={`${K}0e`}/>
      {/* body */}
      <path d="M206 78 C199 84 197 96 201 104 C206 112 218 116 230 112 C240 108 245 96 239 88 C233 80 218 74 210 76 C208 76 206 78 206 78 Z" stroke={K} strokeWidth="2.2" fill={`${K}0c`}/>
      <path d="M204 86 C208 84 214 82 221 82" stroke={D} strokeWidth="0.6" fill="none" opacity="0.45"/>
      <path d="M202 93 C207 91 214 89 222 89" stroke={D} strokeWidth="0.6" fill="none" opacity="0.4"/>
      <path d="M203 100 C208 98 215 96 224 96" stroke={D} strokeWidth="0.5" fill="none" opacity="0.35"/>
      <path d="M202 82 L198 92" stroke={D} strokeWidth="0.7" opacity="0.45"/><path d="M200 90 L196 100" stroke={D} strokeWidth="0.6" opacity="0.4"/>
      <path d="M240 80 L244 90" stroke={D} strokeWidth="0.7" opacity="0.45"/><path d="M242 88 L246 98" stroke={D} strokeWidth="0.6" opacity="0.4"/>
      {/* arms gripping branch */}
      <path d="M204 82 C196 88 192 100 195 108 C198 114 205 113 207 108" stroke={K} strokeWidth="1.3" fill={`${K}0c`}/>
      <path d="M194 106 C191 110 193 118 198 120 C204 122 209 118 208 112" stroke={K} strokeWidth="1.1" fill={`${K}0c`}/>
      <path d="M236 76 C244 80 248 92 244 100 C241 107 234 106 232 100" stroke={K} strokeWidth="1.3" fill={`${K}0c`}/>
      <path d="M244 98 C249 102 250 110 246 114 C241 118 235 115 234 108" stroke={K} strokeWidth="1.1" fill={`${K}0c`}/>
      {/* neck */}
      <path d="M212 74 C210 66 213 59 220 57 C227 55 233 59 232 67 C232 74 228 76 224 76" stroke={K} strokeWidth="1.2" fill={`${K}0a`}/>
      {/* head */}
      <path d="M208 44 C200 38 192 42 190 52 C188 60 193 72 202 78 C210 84 226 84 234 78 C242 72 244 58 238 50 C232 42 220 40 212 42 Z" stroke={K} strokeWidth="2.2" fill={`${K}0a`}/>
      {/* brow */}
      <path d="M194 54 C200 47 210 44 222 48 C230 50 236 56 234 61" stroke={K} strokeWidth="2.8" fill="none" strokeLinecap="round"/>
      <path d="M196 57 C202 51 212 48 222 52" stroke={D} strokeWidth="0.7" fill="none" opacity="0.4"/>
      {/* ears */}
      <path d="M192 56 C185 52 181 59 183 67 C185 74 192 78 197 74" stroke={K} strokeWidth="1.6" fill={`${K}08`}/>
      <path d="M236 54 C242 50 246 57 244 65 C242 72 236 76 231 72" stroke={K} strokeWidth="1.6" fill={`${K}08`}/>
      {/* muzzle — narrow, primate */}
      <ellipse cx="218" cy="64" rx="17" ry="14" stroke={K} strokeWidth="1.2" fill={`${K}08`}/>
      {/* eyes */}
      <ellipse cx="206" cy="56" rx="5" ry="4" stroke={K} strokeWidth="0.9" fill={`${D}38`}/>
      <circle cx="206" cy="56" r="2.5" fill={D} opacity="0.9"/>
      <circle cx="207" cy="55" r="1" fill="white" opacity="0.4"/>
      <path d="M201 53 Q206 51 211 54" stroke={D} strokeWidth="0.7" fill="none"/>
      <ellipse cx="230" cy="56" rx="5" ry="4" stroke={K} strokeWidth="0.9" fill={`${D}38`}/>
      <circle cx="230" cy="56" r="2.5" fill={D} opacity="0.9"/>
      <circle cx="231" cy="55" r="1" fill="white" opacity="0.4"/>
      <path d="M225 53 Q230 51 235 54" stroke={D} strokeWidth="0.7" fill="none"/>
      {/* nose */}
      <ellipse cx="214" cy="64" rx="3.5" ry="2.5" stroke={D} strokeWidth="0.8" fill={`${D}25`}/>
      <ellipse cx="222" cy="64" rx="3.5" ry="2.5" stroke={D} strokeWidth="0.8" fill={`${D}25`}/>
      {/* mouth */}
      <path d="M208 72 C215 77 224 77 230 72" stroke={K} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* face hatching */}
      <path d="M196 52 L194 58" stroke={D} strokeWidth="0.5" opacity="0.45"/><path d="M238 52 L240 58" stroke={D} strokeWidth="0.5" opacity="0.45"/>
    </svg>
  )
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()

  const [{ data: welcomeVideo }, { data: rawSessions }] = await Promise.all([
    supabase
      .from('videos')
      .select('id, title, thumbnail_url')
      .eq('id', WELCOME_VIDEO_ID)
      .single(),
    PINNED_SESSION_IDS.length
      ? supabase
          .from('live_sessions')
          .select('id, title, scheduled_at, duration_minutes, creator_id, status')
          .in('id', PINNED_SESSION_IDS)
          .order('scheduled_at', { ascending: true })
      : supabase
          .from('live_sessions')
          .select('id, title, scheduled_at, duration_minutes, creator_id, status')
          .in('status', ['scheduled', 'live'])
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(3),
  ])

  const sessionCreatorIds = [...new Set((rawSessions ?? []).map((s) => s.creator_id))]
  const { data: sessionProfiles } = sessionCreatorIds.length
    ? await supabase
        .from('profiles')
        .select('user_id, display_name, photo_url')
        .in('user_id', sessionCreatorIds)
    : { data: [] }
  const profileById = Object.fromEntries((sessionProfiles ?? []).map((p) => [p.user_id, p]))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upcomingSessions = ((rawSessions ?? []) as any[]).map((s) => ({ ...s, creator: profileById[s.creator_id] ?? null }))

  return (
    <ParallaxForest>
    <div className="min-h-screen">

      <Navbar />

      {/* Hero — ParallaxForest provides the bg image; overlay handles readability */}
      <div>
        {/* Dark overlay */}
        <div className="bg-jungle-950/70">
        <section className="pt-28 pb-24 px-6 text-center relative overflow-hidden">

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
                ['yoga',       '🧘', 'Yoga'],
                ['strength',   '💪', 'Strength'],
                ['mobility',   '🌀', 'Mobility'],
                ['breathwork', '🌬️', 'Breathwork'],
                ['dance',      '💃', 'Dance'],
                ['kettlebell', '🔔', 'Kettlebell'],
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
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-[1fr_1.3fr_1fr] gap-4 text-center">
            {[
              { emoji: '🔍', title: 'Find a teacher', body: 'Browse by style — yoga, kettlebell, mobility, and more.', href: '/classes' },
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
        </div>{/* end overlay */}
      </div>

      {/* Pricing — fun & transparent */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: pricing info */}
          <div>
            <p className="text-xs font-semibold text-jungle-500 uppercase tracking-widest mb-3">Radical Transparency</p>
            <h2 className="text-4xl font-black text-stone-900 mb-3">Buy classes from lovers of movement.</h2>
            <p className="text-stone-600 text-lg mb-8">
              Creator sets their price. Choose your tier.<br />80% goes directly to the teacher, 20% to JungleGym.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { emoji: '🌱', tier: 'Supported', bg: 'bg-stone-50', border: 'border-stone-200' },
                { emoji: '🌿', tier: 'Community', bg: 'bg-jungle-50', border: 'border-jungle-200' },
                { emoji: '🌳', tier: 'Abundance', bg: 'bg-jungle-100', border: 'border-jungle-300' },
              ].map((t) => (
                <div key={t.tier} className={`${t.bg} border ${t.border} rounded-xl p-5 flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 sm:text-center`}>
                  <div className="text-3xl">{t.emoji}</div>
                  <h3 className="font-black text-stone-900 text-sm">{t.tier}</h3>
                </div>
              ))}
            </div>
          </div>

          {/* Right: welcome video */}
          <div>
            <Link
              href={`/video/${WELCOME_VIDEO_ID}`}
              className="group block rounded-2xl overflow-hidden border border-stone-200 hover:border-jungle-300 transition-colors shadow-sm hover:shadow-md"
            >
              <div className="aspect-video bg-stone-900 relative">
                {welcomeVideo?.thumbnail_url && (
                  <img
                    src={welcomeVideo.thumbnail_url}
                    alt={welcomeVideo.title ?? 'Welcome to JungleGym'}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-colors">
                    <svg className="w-6 h-6 text-jungle-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 bg-white">
                <p className="text-xs font-semibold text-jungle-600 uppercase tracking-widest mb-1">Watch</p>
                <p className="font-bold text-stone-900 text-base leading-snug">
                  {welcomeVideo?.title ?? 'Welcome to JungleGym'}
                </p>
              </div>
            </Link>
          </div>

        </div>
      </section>

      {/* Philosophy blurb — ParallaxForest bg shows through the dark overlay */}
      <section>
      <div className="bg-jungle-950/70 py-20 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header — centered */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-5">
              <img
                src={IMG_MONKEY_SECTION}
                alt="Chimpanzee — Philip Henry Gosse, 1848 (public domain)"
                className="w-32 h-auto invert mix-blend-screen opacity-55"
              />
            </div>
            <p className="text-jungle-400 text-sm font-semibold uppercase tracking-widest mb-3">The oldest wisdom</p>
            <h2 className="text-4xl font-black text-white mb-4">Monkey see. Monkey do.</h2>
            <div className="w-20 h-px bg-earth-300/60 mx-auto" />
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

            {/* Left: purpose statement quote */}
            <blockquote className="bg-black/25 rounded-2xl px-6 py-5 border-l-2 border-jungle-500">
              <p className="text-xl font-bold text-white leading-snug mb-4">
                &ldquo;Liquidate Physical Education. Replace the standardized, joyless model with vetted
                teachers sharing what they love, students choosing what moves them, money flowing
                directly to the source.&rdquo;
              </p>
              <Link
                href="/why"
                className="text-jungle-400 hover:text-jungle-300 text-sm font-semibold transition-colors"
              >
                Read the full purpose statement →
              </Link>
            </blockquote>

            {/* Right: updated text */}
            <div className="bg-black/25 rounded-2xl px-6 py-5 text-jungle-200 text-lg leading-relaxed space-y-4">
              <p>Mimicry is the oldest way to learn.</p>
              <p>JungleGym is built on that idea.</p>
              <p>Watch someone move with ease, and your body starts to understand — mirror neurons activate.</p>
            </div>

          </div>

          {/* CTA — full-width wood-texture button */}
          <Link
            href="/classes"
            className="block w-full text-center font-display font-black text-white text-xl py-5 rounded-xl transition-all hover:brightness-110 shadow-lg"
            style={{
              background: "repeating-linear-gradient(88deg, transparent 0px, transparent 10px, rgba(0,0,0,0.07) 10px, rgba(0,0,0,0.07) 11px), linear-gradient(135deg, #c4892a 0%, #a36b1e 40%, #7a5018 75%, #c4892a 100%)"
            }}
          >
            Start training now
          </Link>

        </div>
        </div>{/* end overlay */}
      </section>

      {/* Live sessions */}
      <section className="py-14 px-6 bg-stone-50 border-t border-stone-200">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* Left: blurb */}
          <div>
            <h2 className="text-2xl font-black text-stone-900 mb-2">We stream live classes.</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-5">
              Live classes let you move alongside a real guide, ask questions mid-practice, and get the kind of personalization you just can&apos;t get from a recording.
            </p>
            <Link href="/sessions" className="inline-block bg-jungle-800 hover:bg-jungle-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
              See all sessions →
            </Link>
          </div>

          {/* Right: upcoming sessions */}
          <div className="space-y-3">
            {upcomingSessions.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-xl p-5 text-center">
                <p className="text-stone-400 text-sm">No sessions scheduled yet.</p>
                <p className="text-stone-400 text-xs mt-1">Check back soon.</p>
              </div>
            ) : (
              upcomingSessions.map((s) => {
                const d = new Date(s.scheduled_at)
                const isLive = s.status === 'live'
                return (
                  <Link
                    key={s.id}
                    href={`/sessions/${s.id}`}
                    className="flex items-center gap-4 bg-white border border-stone-200 hover:border-jungle-400 rounded-xl px-4 py-3 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center text-lg flex-shrink-0">
                      {s.creator?.photo_url
                        ? <img src={s.creator.photo_url} alt="" className="w-full h-full object-cover" />
                        : '🌿'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isLive && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">LIVE</span>}
                        <p className="font-semibold text-stone-900 text-sm truncate group-hover:text-jungle-700">{s.title}</p>
                      </div>
                      {s.creator?.display_name && (
                        <p className="text-xs text-stone-400">{s.creator.display_name}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-stone-700">
                        {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-stone-400">
                        {d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>

        </div>
      </section>

      <Footer />
    </div>
    </ParallaxForest>
  )
}
