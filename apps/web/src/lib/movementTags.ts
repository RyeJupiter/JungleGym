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

  // Yoga styles
  'vinyasa', 'hatha', 'yin', 'ashtanga', 'restorative', 'flow',
  'kundalini', 'bikram', 'iyengar', 'nidra', 'prenatal',

  // Level
  'beginner', 'intermediate', 'advanced', 'all-levels',

  // Body focus
  'core', 'upper-body', 'lower-body', 'full-body', 'back', 'hips',
  'shoulders', 'arms', 'legs', 'glutes', 'chest', 'neck',

  // Equipment
  'bodyweight', 'no-equipment', 'dumbbell', 'barbell', 'resistance-band',
  'mat', 'block', 'strap', 'ring', 'parallette', 'pull-up-bar',

  // Intent / format
  'warmup', 'cooldown', 'recovery', 'morning', 'evening', 'quick',
  'tutorial', 'flow', 'masterclass', 'drill', 'challenge',
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
