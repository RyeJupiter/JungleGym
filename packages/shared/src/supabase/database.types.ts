export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      gifts: {
        Row: {
          created_at: string
          creator_amount: number
          giver_id: string
          id: string
          message: string | null
          platform_amount: number
          platform_tip_pct: number
          session_id: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          creator_amount: number
          giver_id: string
          id?: string
          message?: string | null
          platform_amount: number
          platform_tip_pct?: number
          session_id: string
          total_amount: number
        }
        Update: {
          created_at?: string
          creator_amount?: number
          giver_id?: string
          id?: string
          message?: string | null
          platform_amount?: number
          platform_tip_pct?: number
          session_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "gifts_giver_id_fkey"
            columns: ["giver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          cf_input_id: string | null
          cf_playback_id: string | null
          cf_stream_key: string | null
          created_at: string
          creator_id: string
          description: string | null
          duration_minutes: number
          id: string
          max_participants: number | null
          paused_at: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["session_status"]
          title: string
          updated_at: string
        }
        Insert: {
          cf_input_id?: string | null
          cf_playback_id?: string | null
          cf_stream_key?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          duration_minutes?: number
          id?: string
          max_participants?: number | null
          paused_at?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["session_status"]
          title: string
          updated_at?: string
        }
        Update: {
          cf_input_id?: string | null
          cf_playback_id?: string | null
          cf_stream_key?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          max_participants?: number | null
          paused_at?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          abundance_rate: number
          bio: string | null
          community_rate: number
          created_at: string
          display_name: string
          id: string
          instagram_url: string | null
          location: string | null
          notification_email: string | null
          notification_pref: string
          notification_threshold: number
          photo_url: string | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          suggested_tip: number | null
          supported_rate: number
          tagline: string | null
          tags: string[]
          treehouse_config: Json | null
          updated_at: string
          user_id: string
          username: string
          website_url: string | null
        }
        Insert: {
          abundance_rate?: number
          bio?: string | null
          community_rate?: number
          created_at?: string
          display_name: string
          id?: string
          instagram_url?: string | null
          location?: string | null
          notification_email?: string | null
          notification_pref?: string
          notification_threshold?: number
          photo_url?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          suggested_tip?: number | null
          supported_rate?: number
          tagline?: string | null
          tags?: string[]
          treehouse_config?: Json | null
          updated_at?: string
          user_id: string
          username: string
          website_url?: string | null
        }
        Update: {
          abundance_rate?: number
          bio?: string | null
          community_rate?: number
          created_at?: string
          display_name?: string
          id?: string
          instagram_url?: string | null
          location?: string | null
          notification_email?: string | null
          notification_pref?: string
          notification_threshold?: number
          photo_url?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          suggested_tip?: number | null
          supported_rate?: number
          tagline?: string | null
          tags?: string[]
          treehouse_config?: Json | null
          updated_at?: string
          user_id?: string
          username?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount_paid: number
          created_at: string
          expires_at: string | null
          id: string
          platform_amount: number
          platform_tip_pct: number
          stripe_payment_intent_id: string | null
          tier: Database["public"]["Enums"]["price_tier"]
          total_amount: number
          user_id: string
          video_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          expires_at?: string | null
          id?: string
          platform_amount?: number
          platform_tip_pct?: number
          stripe_payment_intent_id?: string | null
          tier: Database["public"]["Enums"]["price_tier"]
          total_amount?: number
          user_id: string
          video_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          platform_amount?: number
          platform_tip_pct?: number
          stripe_payment_intent_id?: string | null
          tier?: Database["public"]["Enums"]["price_tier"]
          total_amount?: number
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      site_admins: {
        Row: {
          added_at: string
          added_by: string | null
          email: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          email: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          email?: string
        }
        Relationships: []
      }
      teacher_applications: {
        Row: {
          created_at: string
          demo_video_url: string | null
          id: string
          instagram_url: string | null
          motivation: string | null
          movement_types: string[]
          other_movement: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          demo_video_url?: string | null
          id?: string
          instagram_url?: string | null
          motivation?: string | null
          movement_types?: string[]
          other_movement?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          demo_video_url?: string | null
          id?: string
          instagram_url?: string | null
          motivation?: string | null
          movement_types?: string[]
          other_movement?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      video_shares: {
        Row: {
          created_at: string
          id: string
          owner_user_id: string
          redeemed_at: string | null
          redeemed_by: string | null
          token: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_user_id: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          token?: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_user_id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          token?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_shares_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_shares_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_shares_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          duration_seconds: number | null
          ghost_tags: string[] | null
          id: string
          is_free: boolean
          price_abundance: number | null
          price_community: number | null
          price_supported: number | null
          published: boolean
          tags: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
          view_count: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          duration_seconds?: number | null
          ghost_tags?: string[] | null
          id?: string
          is_free?: boolean
          price_abundance?: number | null
          price_community?: number | null
          price_supported?: number | null
          published?: boolean
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          view_count?: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          duration_seconds?: number | null
          ghost_tags?: string[] | null
          id?: string
          is_free?: boolean
          price_abundance?: number | null
          price_community?: number | null
          price_supported?: number | null
          published?: boolean
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "videos_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          related_id: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          related_id?: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          related_id?: string | null
          type?: Database["public"]["Enums"]["wallet_tx_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      redeem_video_share: {
        Args: { p_token: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      application_status: "pending" | "approved" | "rejected"
      price_tier: "supported" | "community" | "abundance"
      session_status: "scheduled" | "live" | "completed" | "cancelled"
      user_role: "creator" | "learner"
      wallet_tx_type: "topup" | "gift_sent" | "gift_received" | "refund"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: ["pending", "approved", "rejected"],
      price_tier: ["supported", "community", "abundance"],
      session_status: ["scheduled", "live", "completed", "cancelled"],
      user_role: ["creator", "learner"],
      wallet_tx_type: ["topup", "gift_sent", "gift_received", "refund"],
    },
  },
} as const
