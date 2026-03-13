export type LiveSessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled'

export interface LiveSession {
  id: string
  creatorId: string
  title: string
  description: string | null
  scheduledAt: string
  durationMinutes: number
  status: LiveSessionStatus
  maxParticipants: number | null
  createdAt: string
  updatedAt: string
}

export interface Gift {
  id: string
  sessionId: string
  giverId: string
  creatorAmount: number      // what the giver intends for the creator
  platformTipPct: number     // adjustable, default 10.0
  platformAmount: number     // calculated: creatorAmount * (platformTipPct / 100)
  totalAmount: number        // creatorAmount + platformAmount
  message: string | null
  createdAt: string
}
