export interface Profile {
  id: string
  userId: string
  displayName: string
  username: string
  photoUrl: string | null
  bio: string | null
  tagline: string | null
  location: string | null
  tags: string[]
  // Creator pricing defaults (per minute)
  supportedRate: number
  communityRate: number
  abundanceRate: number
  stripeAccountId: string | null
  stripeOnboardingComplete: boolean
  createdAt: string
  updatedAt: string
}
