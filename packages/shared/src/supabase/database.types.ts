export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'creator' | 'learner'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'creator' | 'learner'
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          role?: 'creator' | 'learner'
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string
          username: string
          photo_url: string | null
          bio: string | null
          tagline: string | null
          location: string | null
          tags: string[]
          supported_rate: number
          community_rate: number
          abundance_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name: string
          username: string
          photo_url?: string | null
          bio?: string | null
          tagline?: string | null
          location?: string | null
          tags?: string[]
          supported_rate?: number
          community_rate?: number
          abundance_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string
          username?: string
          photo_url?: string | null
          bio?: string | null
          tagline?: string | null
          location?: string | null
          tags?: string[]
          supported_rate?: number
          community_rate?: number
          abundance_rate?: number
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          video_url: string | null
          duration_seconds: number | null
          is_free: boolean
          price_supported: number | null
          price_community: number | null
          price_abundance: number | null
          tags: string[]
          published: boolean
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          video_url?: string | null
          duration_seconds?: number | null
          is_free?: boolean
          price_supported?: number | null
          price_community?: number | null
          price_abundance?: number | null
          tags?: string[]
          published?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          video_url?: string | null
          duration_seconds?: number | null
          is_free?: boolean
          price_supported?: number | null
          price_community?: number | null
          price_abundance?: number | null
          tags?: string[]
          published?: boolean
          updated_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          user_id: string
          video_id: string
          tier: 'supported' | 'community' | 'abundance'
          amount_paid: number
          platform_tip_pct: number
          platform_amount: number
          total_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          tier: 'supported' | 'community' | 'abundance'
          amount_paid: number
          platform_tip_pct?: number
          platform_amount: number
          total_amount: number
          created_at?: string
        }
        Update: Record<string, never>
      }
      live_sessions: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          scheduled_at: string
          duration_minutes: number
          status: 'scheduled' | 'live' | 'completed' | 'cancelled'
          max_participants: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          scheduled_at: string
          duration_minutes?: number
          status?: 'scheduled' | 'live' | 'completed' | 'cancelled'
          max_participants?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          scheduled_at?: string
          duration_minutes?: number
          status?: 'scheduled' | 'live' | 'completed' | 'cancelled'
          max_participants?: number | null
          updated_at?: string
        }
      }
      gifts: {
        Row: {
          id: string
          session_id: string
          giver_id: string
          creator_amount: number
          platform_tip_pct: number
          platform_amount: number
          total_amount: number
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          giver_id: string
          creator_amount: number
          platform_tip_pct?: number
          platform_amount: number
          total_amount: number
          message?: string | null
          created_at?: string
        }
        Update: Record<string, never>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'creator' | 'learner'
      session_status: 'scheduled' | 'live' | 'completed' | 'cancelled'
      price_tier: 'supported' | 'community' | 'abundance'
    }
  }
}
