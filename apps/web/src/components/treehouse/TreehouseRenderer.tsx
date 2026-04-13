import Link from 'next/link'
import type { TreehouseConfig } from './config'
import { THEME_MAP } from './themes'
import { SectionRenderer } from './sections/SectionRenderer'
import type { TreehouseData } from './sections/SectionRenderer'
import { TreehouseBanner } from './TreehouseBanner'

type Props = {
  config: TreehouseConfig
  data: TreehouseData
}

export function TreehouseRenderer({ config, data }: Props) {
  const theme = THEME_MAP[config.theme]

  return (
    <div className={`relative min-h-screen ${theme.pageBg}`}>
      {/* Banner bar with vine arch decoration */}
      <TreehouseBanner theme={config.theme} bannerUrl={config.banner} />

      {/* Sections in configured order */}
      <div>
        {config.sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            data={data}
            theme={theme}
            hasBanner={!!config.banner}
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
    </div>
  )
}
