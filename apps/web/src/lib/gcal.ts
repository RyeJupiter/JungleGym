/** Format a JS Date as YYYYMMDDTHHmmssZ for GCal URL dates param */
export function toGCalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export function buildSessionCalUrl(session: {
  id: string
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
}): string {
  const start = new Date(session.scheduled_at)
  const end = new Date(start.getTime() + session.duration_minutes * 60 * 1000)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://junglegym.academy'
  const details = [
    session.description ?? '',
    '',
    'Join live on JungleGym: ' + origin + '/sessions/' + session.id,
  ].filter(Boolean).join('\n').trim()

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: session.title,
    dates: `${toGCalDate(start)}/${toGCalDate(end)}`,
    details: details.slice(0, 500),
    location: 'JungleGym Live (online)',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Generate an .ics file content string for Apple Calendar / iCal */
export function buildIcsContent(opts: {
  title: string
  description?: string
  start: Date
  end: Date
  location?: string
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const esc = (s: string) => s.replace(/[,;\\]/g, (m) => '\\' + m).replace(/\n/g, '\\n')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JungleGym//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(opts.start)}`,
    `DTEND:${fmt(opts.end)}`,
    `SUMMARY:${esc(opts.title)}`,
    opts.description ? `DESCRIPTION:${esc(opts.description)}` : '',
    opts.location ? `LOCATION:${esc(opts.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}

/** Trigger download of an .ics file */
export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function buildSessionIcs(session: {
  id: string
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
}): string {
  const start = new Date(session.scheduled_at)
  const end = new Date(start.getTime() + session.duration_minutes * 60 * 1000)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://junglegym.academy'
  const desc = [session.description ?? '', '', origin + '/sessions/' + session.id].filter(Boolean).join('\n').trim()
  return buildIcsContent({
    title: session.title,
    description: desc,
    start,
    end,
    location: 'JungleGym Live (online)',
  })
}

export const RRULE_OPTIONS = [
  { label: 'Every day', value: 'RRULE:FREQ=DAILY' },
  { label: 'Weekdays (Mon–Fri)', value: 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
  { label: 'Mon / Wed / Fri', value: 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR' },
  { label: 'Once a week', value: 'RRULE:FREQ=WEEKLY' },
] as const

export function buildVideoCalUrl(opts: {
  videoTitle: string
  videoId: string
  timeHHMM: string
  rrule: string
}): string {
  const [hours, minutes] = opts.timeHHMM.split(':').map(Number)
  const start = new Date()
  start.setHours(hours, minutes, 0, 0)
  if (start <= new Date()) start.setDate(start.getDate() + 1)
  const end = new Date(start.getTime() + 60 * 60 * 1000) // 1h block

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://junglegym.academy'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Practice: ${opts.videoTitle}`,
    dates: `${toGCalDate(start)}/${toGCalDate(end)}`,
    details: `${origin}/video/${opts.videoId}`,
    recur: opts.rrule,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
