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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_type: string
          description: string | null
          id: string
          reward_xp: number
          title: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          description?: string | null
          id?: string
          reward_xp?: number
          title: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          description?: string | null
          id?: string
          reward_xp?: number
          title?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          completed_at: string
          duration_minutes: number
          id: string
          session_type: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          duration_minutes: number
          id?: string
          session_type?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string
          duration_minutes?: number
          id?: string
          session_type?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      pets: {
        Row: {
          bond_level: number
          created_at: string
          experience: number
          id: string
          is_favorite: boolean
          mood: number
          name: string
          pet_type: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          bond_level?: number
          created_at?: string
          experience?: number
          id?: string
          is_favorite?: boolean
          mood?: number
          name: string
          pet_type: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          bond_level?: number
          created_at?: string
          experience?: number
          id?: string
          is_favorite?: boolean
          mood?: number
          name?: string
          pet_type?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quests: {
        Row: {
          completed_at: string | null
          created_at: string
          current_progress: number
          description: string | null
          id: string
          quest_type: string
          reward_xp: number
          target_value: number
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          description?: string | null
          id?: string
          quest_type: string
          reward_xp?: number
          target_value: number
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          description?: string | null
          id?: string
          quest_type?: string
          reward_xp?: number
          target_value?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          id: string
          user_id: string
          operation: string
          amount: number
          source_or_purpose: string
          balance_before: number
          balance_after: number
          session_id: string | null
          item_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          operation: string
          amount: number
          source_or_purpose: string
          balance_before: number
          balance_after: number
          session_id?: string | null
          item_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          operation?: string
          amount?: number
          source_or_purpose?: string
          balance_before?: number
          balance_after?: number
          session_id?: string | null
          item_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          coins: number
          created_at: string
          current_level: number
          current_streak: number
          id: string
          last_session_date: string | null
          longest_streak: number
          streak_freeze_count: number
          total_coins_earned: number
          total_coins_spent: number
          total_sessions: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coins?: number
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          last_session_date?: string | null
          longest_streak?: number
          streak_freeze_count?: number
          total_coins_earned?: number
          total_coins_spent?: number
          total_sessions?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coins?: number
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          last_session_date?: string | null
          longest_streak?: number
          streak_freeze_count?: number
          total_coins_earned?: number
          total_coins_spent?: number
          total_sessions?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          animation_speed: string | null
          auto_save_enabled: boolean | null
          background_music: string | null
          created_at: string | null
          id: string
          language: string | null
          notifications_enabled: boolean | null
          sound_enabled: boolean | null
          theme: string | null
          timer_sound: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          animation_speed?: string | null
          auto_save_enabled?: boolean | null
          background_music?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          timer_sound?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          animation_speed?: string | null
          auto_save_enabled?: boolean | null
          background_music?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          timer_sound?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          environment: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          original_transaction_id: string | null
          period: string
          platform: string
          product_id: string
          purchase_date: string
          receipt_data: string | null
          revoked_at: string | null
          signed_transaction: string | null
          tier: string
          transaction_id: string
          updated_at: string | null
          user_id: string | null
          validated_at: string | null
        }
        Insert: {
          created_at?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          original_transaction_id?: string | null
          period: string
          platform: string
          product_id: string
          purchase_date: string
          receipt_data?: string | null
          revoked_at?: string | null
          signed_transaction?: string | null
          tier: string
          transaction_id: string
          updated_at?: string | null
          user_id?: string | null
          validated_at?: string | null
        }
        Update: {
          created_at?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          original_transaction_id?: string | null
          period?: string
          platform?: string
          product_id?: string
          purchase_date?: string
          receipt_data?: string | null
          revoked_at?: string | null
          signed_transaction?: string | null
          tier?: string
          transaction_id?: string
          updated_at?: string | null
          user_id?: string | null
          validated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deactivate_expired_subscriptions: { Args: never; Returns: number }
      get_user_subscription_tier: {
        Args: { p_user_id: string }
        Returns: {
          expires_at: string
          is_lifetime: boolean
          tier: string
        }[]
      }
      verify_coin_balance: {
        Args: { p_user_id: string }
        Returns: {
          stored_balance: number
          calculated_balance: number
          total_earned: number
          total_spent: number
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
