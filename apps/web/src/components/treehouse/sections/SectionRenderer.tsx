import type { SectionConfig, HeroVariant } from '../config'
import type { ThemeClasses } from '../themes'
import { HeroSection } from './HeroSection'
import { LiveSessionsSection } from './LiveSessionsSection'
import { VideoGridSection } from './VideoGridSection'
import { IntroVideoSection } from './IntroVideoSection'
import { PhotoGallerySection } from './PhotoGallerySection'
import { BioSection } from './BioSection'
import type { GalleryImage } from './PhotoGallerySection'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TreehouseData = {
  profile: {
    user_id: string
    display_name: string
    username: string
    photo_url: string | null
    tagline: string | null
    bio: string | null
    location: string | null
    tags: string[]
    supported_rate: number
    community_rate: number
    abundance_rate: number
    instagram_url: string | null
    website_url: string | null
  }
  freeVideos: VideoData[]
  paidVideos: VideoData[]
  allVideos: VideoData[]
  sessions: SessionData[]
  isOwnProfile: boolean
}

type VideoData = {
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

type SessionData = {
  id: string
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
  status: string
  max_participants: number | null
}

type Props = {
  section: SectionConfig
  data: TreehouseData
  theme: ThemeClasses
  editing?: boolean
  onFieldChange?: (field: string, value: string) => void
  onSectionDataChange?: (sectionId: string, data: Record<string, unknown>) => void
  onPhotoChange?: (file: File | null, previewUrl: string | null) => void
}

export function SectionRenderer({
  section,
  data,
  theme,
  editing = false,
  onFieldChange,
  onSectionDataChange,
  onPhotoChange,
}: Props) {
  if (!section.visible && !editing) return null

  const opacity = !section.visible && editing ? 'opacity-40' : ''

  switch (section.type) {
    case 'hero':
      return (
        <div className={opacity}>
          <HeroSection
            profile={data.profile}
            videoCount={data.allVideos.length}
            hasLiveSession={data.sessions.some((s) => s.status === 'live')}
            hasPaidVideos={data.paidVideos.length > 0}
            isOwnProfile={data.isOwnProfile}
            theme={theme}
            variant={(section.variant as HeroVariant) ?? 'default'}
            editing={editing}
            onFieldChange={onFieldChange}
            onPhotoChange={onPhotoChange}
          />
        </div>
      )

    case 'live_sessions':
      return (
        <div className={`max-w-5xl mx-auto px-6 ${opacity}`}>
          <LiveSessionsSection sessions={data.sessions} theme={theme} />
        </div>
      )

    case 'free_videos':
      return (
        <div className={`max-w-5xl mx-auto px-6 ${opacity}`}>
          <VideoGridSection
            videos={data.freeVideos}
            title="Free to watch"
            theme={theme}
          />
        </div>
      )

    case 'paid_videos':
      return (
        <div className={`max-w-5xl mx-auto px-6 ${opacity}`}>
          <VideoGridSection
            videos={data.paidVideos}
            title="Paid content"
            theme={theme}
            badgeClass="bg-earth-600 text-earth-100"
          />
        </div>
      )

    case 'intro_video':
      return (
        <div className={`max-w-5xl mx-auto px-6 ${opacity}`}>
          <IntroVideoSection
            videoUrl={(section.data?.url as string) ?? undefined}
            theme={theme}
            editing={editing}
            userId={data.profile.user_id}
            onVideoUploaded={(url) => onSectionDataChange?.(section.id, { url })}
            onVideoRemoved={() => onSectionDataChange?.(section.id, {})}
          />
        </div>
      )

    case 'photo_gallery':
      return (
        <div className={`max-w-5xl mx-auto px-6 ${opacity}`}>
          <PhotoGallerySection
            images={(section.data?.images as GalleryImage[]) ?? []}
            theme={theme}
            editing={editing}
            userId={data.profile.user_id}
            onImagesChange={(images) => onSectionDataChange?.(section.id, { images })}
          />
        </div>
      )

    case 'bio':
      return (
        <div className={`max-w-5xl mx-auto px-6 ${opacity}`}>
          <BioSection
            title={(section.data?.title as string) ?? ''}
            body={(section.data?.body as string) ?? ''}
            theme={theme}
            editing={editing}
            onChange={(title, body) => onSectionDataChange?.(section.id, { title, body })}
          />
        </div>
      )

    default:
      return null
  }
}
