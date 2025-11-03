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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_streaks: {
        Row: {
          current_streak: number
          last_checkin_date: string
          streak_type: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_checkin_date: string
          streak_type: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_checkin_date?: string
          streak_type?: string
          user_id?: string
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          section_name: string
          user_id: string
          video_name: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          section_name: string
          user_id: string
          video_name: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          section_name?: string
          user_id?: string
          video_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          rating_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          rating_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          rating_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      glow_up_logs: {
        Row: {
          created_at: string
          did_haircare: number | null
          did_skincare: number | null
          id: string
          log_date: string
          overthinking_level: number | null
          user_id: string
          wasted_tasks: number | null
        }
        Insert: {
          created_at?: string
          did_haircare?: number | null
          did_skincare?: number | null
          id?: string
          log_date?: string
          overthinking_level?: number | null
          user_id: string
          wasted_tasks?: number | null
        }
        Update: {
          created_at?: string
          did_haircare?: number | null
          did_skincare?: number | null
          id?: string
          log_date?: string
          overthinking_level?: number | null
          user_id?: string
          wasted_tasks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "glow_up_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_logs: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          log_date: string
          muscle_group: string
          reps: number
          sets: number
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          log_date?: string
          muscle_group: string
          reps?: number
          sets?: number
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          log_date?: string
          muscle_group?: string
          reps?: number
          sets?: number
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      health_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          log_type: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          log_type: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          log_type?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "health_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_tasks: {
        Row: {
          created_at: string
          description: string
          due_date: string | null
          estimated_pomodoros: number | null
          id: string
          is_completed: boolean
          is_recurring: boolean | null
          mission_id: string
          notes: string | null
          parent_task_id: string | null
          priority: string | null
          recurrence_pattern: string | null
          reminder_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          due_date?: string | null
          estimated_pomodoros?: number | null
          id?: string
          is_completed?: boolean
          is_recurring?: boolean | null
          mission_id: string
          notes?: string | null
          parent_task_id?: string | null
          priority?: string | null
          recurrence_pattern?: string | null
          reminder_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string | null
          estimated_pomodoros?: number | null
          id?: string
          is_completed?: boolean
          is_recurring?: boolean | null
          mission_id?: string
          notes?: string | null
          parent_task_id?: string | null
          priority?: string | null
          recurrence_pattern?: string | null
          reminder_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_tasks_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "mission_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_locked: boolean
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_locked?: boolean
          start_date: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_locked?: boolean
          start_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_sessions: {
        Row: {
          completed: boolean
          created_at: string
          duration_minutes: number
          ended_at: string | null
          id: string
          session_type: string
          started_at: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          session_type?: string
          started_at?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          session_type?: string
          started_at?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "mission_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_settings: {
        Row: {
          auto_start_breaks: boolean
          auto_start_pomodoros: boolean
          created_at: string
          long_break_duration: number
          notification_sound: string | null
          sessions_before_long_break: number
          short_break_duration: number
          updated_at: string
          user_id: string
          work_duration: number
        }
        Insert: {
          auto_start_breaks?: boolean
          auto_start_pomodoros?: boolean
          created_at?: string
          long_break_duration?: number
          notification_sound?: string | null
          sessions_before_long_break?: number
          short_break_duration?: number
          updated_at?: string
          user_id: string
          work_duration?: number
        }
        Update: {
          auto_start_breaks?: boolean
          auto_start_pomodoros?: boolean
          created_at?: string
          long_break_duration?: number
          notification_sound?: string | null
          sessions_before_long_break?: number
          short_break_duration?: number
          updated_at?: string
          user_id?: string
          work_duration?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_reset_date: string | null
          last_reset_reason: string | null
          start_date: string
          streak_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_reset_date?: string | null
          last_reset_reason?: string | null
          start_date?: string
          streak_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_reset_date?: string | null
          last_reset_reason?: string | null
          start_date?: string
          streak_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          created_at: string
          total_xp: number
          user_id: string
        }
        Insert: {
          created_at?: string
          total_xp?: number
          user_id: string
        }
        Update: {
          created_at?: string
          total_xp?: number
          user_id?: string
        }
        Relationships: []
      }
      xp_logs: {
        Row: {
          amount: number
          created_at: string
          id: number
          source_action: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: never
          source_action: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: never
          source_action?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp: {
        Args: { action_source: string; amount_to_add: number }
        Returns: undefined
      }
      handle_activity_checkin: {
        Args: { streak_type_to_check: string }
        Returns: undefined
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
