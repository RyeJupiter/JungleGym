import Link from 'next/link'
import type { TreehouseConfig } from './config'
import { THEME_MAP } from './themes'
import { SectionRenderer } from './sections/SectionRenderer'
import type { TreehouseData } from './sections/SectionRenderer'

type Props = {
  config: TreehouseConfig
  data: TreehouseData
}

export function TreehouseRenderer({ config, data }: Props) {
  const theme = THEME_MAP[config.theme]

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      {/* Sections in configured order */}
      {config.sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          data={data}
          theme={theme}
        />
      ))}

      {/* Empty state */}
      {data.allVideos.length === 0 && (
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center py-20">
            <div className="text-5xl mb-4 select-none">🌱</div>
            <p className={`${theme.accent} font-semibold text-lg mb-1`}>No videos yet</p>
            <p className={`${theme.textMuted} text-sm`}>
              {data.profile.display_name}&apos;s treehouse is still being built. Check back soon.
            </p>
          </div>
        </div>
      )}

      {/* Footer attribution */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className={`border-t ${theme.divider} pt-8 flex flex-col sm:flex-row items-center justify-between gap-4`}>
          <p className={`${theme.textMuted} text-xs`}>
            {data.profile.display_name}&apos;s treehouse on{' '}
            <Link href="/" className={`${theme.accent} hover:${theme.textPrimary} transition-colors font-semibold`}>
              JungleGym
            </Link>
          </p>
          <Link
            href="/guides"
            className={`${theme.textMuted} hover:${theme.textSecondary} text-xs font-medium transition-colors`}
          >
            Explore More Guides →
          </Link>
        </div>
      </div>
    </div>
  )
}
