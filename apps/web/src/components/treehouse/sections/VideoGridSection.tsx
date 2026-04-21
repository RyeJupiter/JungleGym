import Link from 'next/link'
import { formatPrice, formatDuration } from '@junglegym/shared'
import type { ThemeClasses } from '../themes'
import type { GridVariant } from '../config'

type VideoCardData = {
  id: string
  title: string
  thumbnail_url: string | null
  duration_seconds: number | null
  is_free: boolean
  price_supported: number | null
  price_community: number | null
  price_abundance: number | null
  tags: string[]
  view_count: number
}

type Props = {
  videos: VideoCardData[]
  title: string
  theme: ThemeClasses
  badgeClass?: string
  variant?: GridVariant
}

const GRID_CLASSES: Record<GridVariant, string> = {
  // 1 card per row until tablets, then 2-up. Cards feel like a featured reel.
  showcase: 'grid grid-cols-1 sm:grid-cols-2 gap-5',
  // Unchanged — original default layout.
  default: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
  // 2 on phones, up to 4 on desktop. Good for creators with lots of classes.
  compact: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3',
}

export function VideoGridSection({ videos, title, theme, badgeClass, variant = 'default' }: Props) {
  if (videos.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-5">
        <h2 className={`text-xl font-black ${theme.textPrimary}`}>{title}</h2>
        <span className={`${badgeClass ?? `${theme.badgeBg} ${theme.badgeText}`} text-xs font-bold px-2.5 py-0.5 rounded-full`}>
          {videos.length}
        </span>
      </div>
      <div className={GRID_CLASSES[variant]}>
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} theme={theme} />
        ))}
      </div>
    </section>
  )
}

function VideoCard({ video: v, theme }: { video: VideoCardData; theme: ThemeClasses }) {
  return (
    <Link href={`/video/${v.id}`} className="group block">
      <div className={`${theme.cardBg} border ${theme.cardBorder} ${theme.cardHoverBorder} rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}>
        {/* Thumbnail */}
        <div className="aspect-video bg-jungle-900 relative overflow-hidden">
          {v.thumbnail_url ? (
            <img
              src={v.thumbnail_url}
              alt={v.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${theme.heroBg}`}>
              <span className="text-4xl select-none opacity-60">🌿</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {v.is_free ? (
            <span className="absolute top-2.5 left-2.5 bg-jungle-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow">
              Free
            </span>
          ) : (
            v.price_supported && (
              <span className="absolute top-2.5 left-2.5 bg-earth-500/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow">
                from {formatPrice(Number(v.price_supported))}
              </span>
            )
          )}

          {v.duration_seconds && (
            <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-1.5 py-0.5 rounded">
              {formatDuration(v.duration_seconds)}
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="p-3.5">
          <p className={`font-bold ${theme.textPrimary} text-sm leading-snug mb-1.5 group-hover:${theme.accent} transition-colors line-clamp-2`}>
            {v.title}
          </p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {v.tags.slice(0, 2).map((tag) => (
                <span key={tag} className={`${theme.textMuted} text-xs capitalize`}>
                  {tag}
                </span>
              ))}
              {v.tags.length > 2 && (
                <span className={`${theme.textMuted} text-xs`}>+{v.tags.length - 2}</span>
              )}
            </div>

            {!v.is_free && v.price_supported && v.price_community && v.price_abundance && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {[
                  { label: '🌱', price: v.price_supported },
                  { label: '🌿', price: v.price_community },
                  { label: '🌳', price: v.price_abundance },
                ].map(({ label, price }) => (
                  <span
                    key={label}
                    className={`flex items-center gap-0.5 ${theme.pageBg}/80 ${theme.accent} text-xs px-1.5 py-0.5 rounded`}
                    title={formatPrice(Number(price))}
                  >
                    {label}
                    <span className={`${theme.textSecondary} font-semibold`}>{formatPrice(Number(price))}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
