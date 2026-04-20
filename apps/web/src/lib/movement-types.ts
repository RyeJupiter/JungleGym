// Shared movement taxonomy used by the apply form and the admin application
// panel. Keep these slugs stable — they're stored on teacher_applications rows.

export const MOVEMENT_TYPES: { slug: string; label: string }[] = [
  { slug: 'yoga', label: 'Yoga' },
  { slug: 'dance', label: 'Dance' },
  { slug: 'pilates', label: 'Pilates' },
  { slug: 'mobility', label: 'Mobility' },
  { slug: 'calisthenics', label: 'Calisthenics' },
  { slug: 'strength', label: 'Strength training' },
  { slug: 'martial-arts', label: 'Martial arts' },
  { slug: 'breathwork', label: 'Breathwork' },
  { slug: 'meditation', label: 'Meditation' },
  { slug: 'qigong', label: 'Qigong / Tai chi' },
  { slug: 'animal-flow', label: 'Animal flow' },
  { slug: 'parkour', label: 'Parkour / Movement art' },
  { slug: 'somatics', label: 'Somatics' },
  { slug: 'stretching', label: 'Stretching / Flexibility' },
  { slug: 'running', label: 'Running / Endurance' },
  { slug: 'climbing', label: 'Climbing' },
]

const LABEL_BY_SLUG: Record<string, string> = Object.fromEntries(
  MOVEMENT_TYPES.map((m) => [m.slug, m.label]),
)

export function movementLabel(slug: string): string {
  return LABEL_BY_SLUG[slug] ?? slug
}
