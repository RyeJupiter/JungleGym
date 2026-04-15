'use client'

/**
 * Responsive Cloudflare Stream player.
 *
 * Shows one of three states:
 * - Idle: "Stream hasn't started yet" placeholder
 * - Live: Embedded CF Stream iframe player
 * - Recording: Embedded playback of a saved recording
 */

export function StreamPlayer({
  iframeSrc,
  isLive,
  isRecording,
}: {
  iframeSrc: string
  isLive?: boolean
  isRecording?: boolean
}) {
  if (!iframeSrc) {
    return (
      <div className="bg-stone-900 rounded-2xl aspect-video flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">📡</p>
          <p className="text-white/70 font-medium">Stream not available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black">
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}
      {isRecording && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-stone-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
          Replay
        </div>
      )}

      {/* 16:9 responsive iframe */}
      <div className="aspect-video">
        <iframe
          src={iframeSrc}
          className="w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}

/**
 * Placeholder shown when streaming is not yet set up for a session.
 */
export function StreamPlaceholder({
  isLive,
  isPast,
  scheduledAt,
}: {
  isLive: boolean
  isPast: boolean
  scheduledAt: string
}) {
  const scheduled = new Date(scheduledAt)
  const msUntilStart = scheduled.getTime() - Date.now()
  const withinHour = msUntilStart > 0 && msUntilStart <= 60 * 60 * 1000
  const pastStart = msUntilStart <= 0

  const dayStr = scheduled.toLocaleDateString(undefined, { weekday: 'long' })
  const timeStr = scheduled.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="bg-jungle-50 border border-jungle-200 rounded-2xl p-8 text-center mb-6">
      <p className="text-4xl mb-3">🌿</p>
      <p className="font-bold text-jungle-800 mb-1">
        {isLive
          ? 'The session is happening now!'
          : isPast
          ? 'This session has ended.'
          : pastStart
          ? "We're running a little behind!"
          : withinHour
          ? 'Session starts soon'
          : 'Live session scheduled'}
      </p>
      {isLive && (
        <p className="text-jungle-600 text-sm">Live streaming is coming soon. For now, connect with the teacher directly.</p>
      )}
      {isPast && (
        <p className="text-jungle-600 text-sm">Thanks for attending! Check out more sessions below.</p>
      )}
      {!isLive && !isPast && !pastStart && !withinHour && (
        <p className="text-jungle-600 text-sm">Come back {dayStr} at {timeStr} to join.</p>
      )}
    </div>
  )
}
