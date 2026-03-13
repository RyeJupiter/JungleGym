export type UserRole = 'creator' | 'learner'

export interface User {
  id: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface TeacherApplication {
  id: string
  userId: string
  motivation: string | null
  status: ApplicationStatus
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}
