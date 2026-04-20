/**
 * Returns a safe href for a user-supplied URL, or null if the scheme is
 * dangerous (javascript:, data:, vbscript:, file:). If the input has no
 * scheme, prepends https:// so bare hostnames like "example.com" work.
 */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  if (/^\s*(javascript|data|vbscript|file):/i.test(trimmed)) return null

  // Accept http(s) and protocol-relative; otherwise prepend https://
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) return 'https:' + trimmed
  // Bare hostname or path — treat as https
  return 'https://' + trimmed.replace(/^\/+/, '')
}
