import Link from 'next/link'
import type { ThemeClasses } from '../themes'

type SessionData = {
  id: string
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
  status: string
  max_participants: number | null
}

type Props = {
  sessions: SessionData[]
  theme: ThemeClasses
}

export function LiveSessionsSection({ sessions, theme }: Props) {
  if (sessions.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-xl font-black ${theme.textPrimary} flex items-center gap-2`}>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Upcoming sessions
        </h2>
        <Link
          href="/sessions"
          className={`${theme.accent} hover:${theme.textPrimary} text-sm font-medium transition-colors`}
        >
          All sessions →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sessions.map((s) => {
          const sessionDate = new Date(s.scheduled_at)
          const isLive = s.status === 'live'
          return (
            <div
              key={s.id}
              className={`rounded-xl border p-5 transition-colors ${
                isLive
                  ? 'bg-green-900/30 border-green-700/60 hover:border-green-500'
                  : `${theme.cardBg} ${theme.cardBorder} ${theme.cardHoverBorder}`
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className={`font-bold ${theme.textPrimary} text-sm leading-snug`}>{s.title}</p>
                {isLive ? (
                  <span className="flex-shrink-0 flex items-center gap-1 bg-green-700 text-green-100 text-xs font-bold px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                    Live now
                  </span>
                ) : (
                  <span className={`flex-shrink-0 ${theme.badgeBg} ${theme.badgeText} text-xs font-semibold px-2.5 py-1 rounded-full`}>
                    Gift-based
                  </span>
                )}
              </div>

              {s.description && (
                <p className={`${theme.textMuted} text-xs leading-relaxed mb-3 line-clamp-2`}>
                  {s.description}
                </p>
              )}

              <div className={`flex items-center gap-3 ${theme.textMuted} text-xs`}>
                <span>
                  {sessionDate.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span>·</span>
                <span>
                  {sessionDate.toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                <span>·</span>
                <span>{s.duration_minutes} min</span>
                {s.max_participants && (
                  <>
                    <span>·</span>
                    <span>max {s.max_participants}</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
