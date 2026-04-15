'use client'

/**
 * Renders a date/time string in the viewer's local timezone.
 * Use this instead of toLocaleTimeString/toLocaleDateString in Server Components,
 * which run in UTC on Cloudflare Workers and show wrong times.
 */
export function LocalTime({
  iso,
  options,
}: {
  iso: string
  options?: Intl.DateTimeFormatOptions
}) {
  const d = new Date(iso)
  return <time dateTime={iso}>{d.toLocaleString(undefined, options)}</time>
}
