/**
 * Search utilities for building Supabase/PostgREST filters that include
 * ghost tags, public tags, title, and description.
 *
 * Ghost tags are stored as lowercase hyphenated strings ("vinyasa-flow").
 * Users type spaces ("vinyasa flow"). This module normalises both directions
 * so a query like "yoga flow" matches ghost tag "yoga-flow" and vice-versa.
 */

/**
 * Turn a free-text query into candidate tag strings for array overlap matching.
 *
 *   "yoga flow"    → ["yoga-flow", "yoga", "flow"]
 *   "vinyasa-flow" → ["vinyasa-flow", "vinyasa", "flow"]
 *   "hip opener"   → ["hip-opener", "hip", "opener"]
 */
export function buildTagSearchTerms(query: string): string[] {
  const normalized = query
    .toLowerCase()
    .trim()
    // Strip characters that could break PostgREST filter syntax
    .replace(/[{}(),."'\\]/g, '')
  if (!normalized) return []

  const terms = new Set<string>()

  // Full phrase hyphenated
  terms.add(normalized.replace(/[\s-]+/g, '-'))

  // Individual words (split on spaces and hyphens)
  const words = normalized.split(/[\s-]+/).filter(Boolean)
  for (const word of words) {
    terms.add(word)
  }

  // Consecutive pairs for multi-word queries ("morning yoga flow" → "morning-yoga", "yoga-flow")
  if (words.length >= 3) {
    for (let i = 0; i < words.length - 1; i++) {
      terms.add(`${words[i]}-${words[i + 1]}`)
    }
  }

  return [...terms]
}

/**
 * Build a PostgREST `.or()` filter string for video search.
 * Matches against: title, description, tags (public), ghost_tags (AI-generated),
 * and optionally creator IDs (from a prior profile name search).
 *
 * Usage:
 *   videoQuery = videoQuery.or(buildVideoSearchFilter(q, matchingCreatorIds))
 */
export function buildVideoSearchFilter(query: string, creatorIds?: string[]): string {
  const q = query.trim().replace(/[%\\]/g, '')
  if (!q) return ''

  const terms = buildTagSearchTerms(q)
  const tagList = terms.join(',')

  const filters: string[] = [
    `title.ilike.%${q}%`,
    `description.ilike.%${q}%`,
  ]

  if (tagList) {
    filters.push(`tags.ov.{${tagList}}`)
    filters.push(`ghost_tags.ov.{${tagList}}`)
  }

  if (creatorIds && creatorIds.length > 0) {
    filters.push(`creator_id.in.(${creatorIds.join(',')})`)
  }

  return filters.join(',')
}

/**
 * Score a video's relevance to a search query.
 * Higher score = better match. Used to sort results after Supabase returns them.
 *
 * Scoring hierarchy:
 *   Title exact match          100
 *   Creator name exact match    90
 *   Title starts with query     80
 *   Title contains query        60
 *   Creator name contains query 50
 *   Full-phrase tag match       40  ("morning-yoga-flow" in tags)
 *   Bigram tag match            25  ("morning-yoga" in tags)
 *   Description contains query  20
 *   Single-word tag match       10  ("yoga" in tags)
 */
export function scoreVideoRelevance(
  query: string,
  video: { title?: string; description?: string | null; tags?: string[] | null; ghost_tags?: string[] | null },
  creatorName?: string,
): number {
  const q = query.toLowerCase().trim()
  if (!q) return 0

  let score = 0
  const title = video.title?.toLowerCase() ?? ''
  const desc = video.description?.toLowerCase() ?? ''
  const allTags = [...(video.tags ?? []), ...(video.ghost_tags ?? [])]

  // Title matches (highest priority)
  if (title === q) score += 100
  else if (title.startsWith(q)) score += 80
  else if (title.includes(q)) score += 60

  // Creator name matches
  if (creatorName) {
    const name = creatorName.toLowerCase()
    if (name === q) score += 90
    else if (name.includes(q)) score += 50
  }

  // Description match
  if (desc.includes(q)) score += 20

  // Full phrase as a tag (most specific tag match)
  const fullPhrase = q.replace(/[\s-]+/g, '-')
  if (allTags.includes(fullPhrase)) score += 40

  // Bigram tag matches
  const words = q.split(/[\s-]+/).filter(Boolean)
  if (words.length >= 2) {
    for (let i = 0; i < words.length - 1; i++) {
      if (allTags.includes(`${words[i]}-${words[i + 1]}`)) score += 25
    }
  }

  // Single-word tag matches
  for (const word of words) {
    if (allTags.some((t) => t === word || t.startsWith(word + '-') || t.endsWith('-' + word))) score += 10
  }

  return score
}

/**
 * Sort videos by relevance to a query, preserving original order as tiebreaker.
 * Pass getCreatorName to include creator display_name in scoring.
 */
export function sortByRelevance<T extends { title?: string; description?: string | null; tags?: string[] | null; ghost_tags?: string[] | null }>(
  query: string,
  items: T[],
  getCreatorName?: (item: T) => string | undefined,
): T[] {
  if (!query?.trim()) return items
  return [...items].sort((a, b) =>
    scoreVideoRelevance(query, b, getCreatorName?.(b)) - scoreVideoRelevance(query, a, getCreatorName?.(a))
  )
}

/**
 * Client-side check: does a video match a search query?
 * Used for filtering already-fetched results (e.g., library page).
 */
export function videoMatchesQuery(
  query: string,
  video: { title?: string; description?: string | null; tags?: string[] | null; ghost_tags?: string[] | null },
  creatorName?: string,
): boolean {
  return scoreVideoRelevance(query, video, creatorName) > 0
}
