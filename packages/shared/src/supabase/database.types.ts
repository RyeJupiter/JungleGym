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
          instagram_url: string | null
          website_url: string | null
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
          instagram_url?: string | null
          website_url?: string | null
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
          instagram_url?: string | null
          website_url?: string | null
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
          stripe_payment_intent_id: string | null
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
          stripe_payment_intent_id?: string | null
          created_at?: string
        }
        Update: Record<string, never>
      }
      memberships: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: string
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: string
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: string
          current_period_end?: string | null
          updated_at?: string
        }
      }
      membership_video_picks: {
        Row: {
          id: string
          membership_id: string
          user_id: string
          video_id: string
          picked_at: string
        }
        Insert: {
          id?: string
          membership_id: string
          user_id: string
          video_id: string
          picked_at?: string
        }
        Update: Record<string, never>
      }
      email_captures: {
        Row: {
          id: string
          email: string
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          source?: string
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
      video_shares: {
        Row: {
          id: string
          video_id: string
          owner_user_id: string
          token: string
          redeemed_by: string | null
          redeemed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          owner_user_id: string
          token?: string
          redeemed_by?: string | null
          redeemed_at?: string | null
          created_at?: string
        }
        Update: {
          redeemed_by?: string | null
          redeemed_at?: string | null
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
    Functions: {
      redeem_video_share: {
        Args: { p_token: string; p_user_id: string }
        Returns: { error?: string; video_id?: string; owner_user_id?: string }
      }
    }
    Enums: {
      user_role: 'creator' | 'learner'
      session_status: 'scheduled' | 'live' | 'completed' | 'cancelled'
      price_tier: 'supported' | 'community' | 'abundance'
    }
  }
}
