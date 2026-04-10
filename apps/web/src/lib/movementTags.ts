// Curated vocabulary for the movement platform.
// Used for tag suggestions: words/phrases from the video title are matched
// against this list. Extend freely — tags here should be things real creators use.

export const MOVEMENT_TAGS: string[] = [
  // Disciplines
  'yoga', 'pilates', 'dance', 'martial-arts', 'strength', 'cardio',
  'flexibility', 'balance', 'mobility', 'breathwork', 'meditation', 'barre',
  'gymnastics', 'calisthenics', 'boxing', 'kickboxing', 'jiu-jitsu', 'wrestling',
  'kettlebell', 'weightlifting', 'powerlifting', 'crossfit', 'hiit',
  'stretching', 'foam-rolling', 'acro', 'handstand', 'parkour',
  'qi-gong', 'tai-chi', 'capoeira', 'breakdancing', 'ballet',
  'contemporary', 'hip-hop', 'salsa', 'swing', 'pole',
  'surfing', 'skateboarding', 'rock-climbing',
  'aerial', 'silks', 'trapeze', 'contortion', 'tumbling', 'tricking', 'freerunning',
  'swimming', 'cycling', 'rowing', 'running',
  'functional', 'corrective', 'somatic', 'feldenkrais',
  'contact-improv', 'floorwork', 'acrobatics',

  // Yoga styles
  'vinyasa', 'hatha', 'yin', 'ashtanga', 'restorative', 'flow',
  'kundalini', 'bikram', 'iyengar', 'nidra', 'prenatal',

  // Level
  'beginner', 'intermediate', 'advanced', 'all-levels',

  // Body focus
  'core', 'upper-body', 'lower-body', 'full-body', 'back', 'hips',
  'shoulders', 'arms', 'legs', 'glutes', 'chest', 'neck',
  'spine', 'wrists', 'ankles', 'knees', 'pelvic-floor', 'posture', 'alignment',

  // Equipment
  'bodyweight', 'no-equipment', 'dumbbell', 'barbell', 'resistance-band',
  'mat', 'block', 'strap', 'ring', 'parallette', 'pull-up-bar',
  'reformer', 'suspension', 'cable',

  // Teaching format
  'tutorial', 'masterclass', 'drill', 'challenge', 'workshop',
  'series', 'program', 'sequence', 'practice', 'technique', 'fundamentals',
  'foundations', 'breakdown', 'guided', 'follow-along',

  // Session style
  'flow', 'warmup', 'cooldown', 'recovery', 'morning', 'evening', 'quick',
  'slow', 'intense', 'gentle', 'dynamic', 'static', 'partner', 'solo',

  // Intent / feeling
  'stress-relief', 'energy', 'focus', 'relaxation', 'activation',
  'grounding', 'centering', 'nervous-system', 'fascia',
]

// Keyword aliases — if the title contains the key, suggest the value tag.
const ALIASES: [RegExp, string][] = [
  [/\bswing(s)?\b/i, 'kettlebell'],
  [/\bsun salut/i, 'yoga'],
  [/\bplank/i, 'core'],
  [/\bdeadlift/i, 'weightlifting'],
  [/\bsquat/i, 'lower-body'],
  [/\bpress\b/i, 'upper-body'],
  [/\bpull[\s-]?up/i, 'upper-body'],
  [/\bchaturanga/i, 'yoga'],
  [/\bsun[\s-]?sal/i, 'yoga'],
  [/\bwarrior/i, 'yoga'],
  [/\bdowndog/i, 'yoga'],
  [/\btadasana/i, 'yoga'],
  [/\bsavasana/i, 'yoga'],
  [/\bmuay[\s-]?thai/i, 'kickboxing'],
  [/\bbjj\b/i, 'jiu-jitsu'],
  [/\bmma\b/i, 'martial-arts'],
  [/\bnerv(ous|e)\b/i, 'nervous-system'],
  [/\bfasci/i, 'fascia'],
  [/\bpelvic/i, 'pelvic-floor'],
  [/\bbreak(down)?\b/i, 'breakdown'],
  [/\bfollow[\s-]?along/i, 'follow-along'],
]

export function suggestTagsFromTitle(title: string): string[] {
  if (!title.trim()) return []
  const lower = title.toLowerCase()
  const suggestions = new Set<string>()

  // Direct vocabulary match
  for (const tag of MOVEMENT_TAGS) {
    const keyword = tag.replace(/-/g, ' ')
    if (lower.includes(keyword) || lower.includes(tag)) {
      suggestions.add(tag)
    }
  }

  // Alias matches
  for (const [pattern, tag] of ALIASES) {
    if (pattern.test(title)) suggestions.add(tag)
  }

  return Array.from(suggestions)
}
