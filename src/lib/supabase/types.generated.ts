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
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_name: string | null
          resource_type: string | null
          user_id: string
          world_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_name?: string | null
          resource_type?: string | null
          user_id: string
          world_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_name?: string | null
          resource_type?: string | null
          user_id?: string
          world_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          created_at: string
          data: Json
          folder_id: string | null
          id: string
          image_url: string | null
          name: string
          tags: string[] | null
          template_id: string | null
          updated_at: string
          world_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          folder_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          tags?: string[] | null
          template_id?: string | null
          updated_at?: string
          world_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          folder_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          tags?: string[] | null
          template_id?: string | null
          updated_at?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entities_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          kind: string
          name: string
          parent_folder_id: string | null
          updated_at: string
          world_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          name: string
          parent_folder_id?: string | null
          updated_at?: string
          world_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          name?: string
          parent_folder_id?: string | null
          updated_at?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      relationships: {
        Row: {
          created_at: string
          description: string | null
          from_entity_id: string
          id: string
          metadata: Json | null
          relationship_type: string
          to_entity_id: string
          updated_at: string
          world_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          from_entity_id: string
          id?: string
          metadata?: Json | null
          relationship_type?: string
          to_entity_id: string
          updated_at?: string
          world_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          from_entity_id?: string
          id?: string
          metadata?: Json | null
          relationship_type?: string
          to_entity_id?: string
          updated_at?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_from_entity_id_fkey"
            columns: ["from_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_to_entity_id_fkey"
            columns: ["to_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          fields: Json
          folder_id: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          updated_at: string
          world_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          fields?: Json
          folder_id?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          updated_at?: string
          world_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          fields?: Json
          folder_id?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          updated_at?: string
          world_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_bans: {
        Row: {
          banned_at: string
          banned_by_user_id: string
          banned_user_id: string
          id: string
          reason: string | null
          world_id: string
        }
        Insert: {
          banned_at?: string
          banned_by_user_id: string
          banned_user_id: string
          id?: string
          reason?: string | null
          world_id: string
        }
        Update: {
          banned_at?: string
          banned_by_user_id?: string
          banned_user_id?: string
          id?: string
          reason?: string | null
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_bans_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_files: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          updated_at: string
          uploaded_by: string | null
          world_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          updated_at?: string
          uploaded_by?: string | null
          world_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          updated_at?: string
          uploaded_by?: string | null
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_files_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
          token: string
          world_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          role: string
          token: string
          world_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          token?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_invites_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_members: {
        Row: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["world_member_role"] | null
          user_id: string
          world_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["world_member_role"] | null
          user_id: string
          world_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["world_member_role"] | null
          user_id?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_members_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      worlds: {
        Row: {
          aesthetic_direction: string | null
          audience_rating: string | null
          calendar_timekeeping: string | null
          climate_biomes: string[] | null
          conflict_drivers: string[] | null
          cosmology_model: string | null
          created_at: string
          description: string | null
          genre_blend: string[] | null
          id: string
          is_archived: boolean | null
          is_public: boolean | null
          key_themes: string[] | null
          logline: string | null
          magic_level: string[] | null
          name: string
          overall_tone: string | null
          owner_id: string
          rules_constraints: string | null
          scope_scale: string | null
          settings: Json | null
          societal_overview: string | null
          technology_level: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aesthetic_direction?: string | null
          audience_rating?: string | null
          calendar_timekeeping?: string | null
          climate_biomes?: string[] | null
          conflict_drivers?: string[] | null
          cosmology_model?: string | null
          created_at?: string
          description?: string | null
          genre_blend?: string[] | null
          id?: string
          is_archived?: boolean | null
          is_public?: boolean | null
          key_themes?: string[] | null
          logline?: string | null
          magic_level?: string[] | null
          name: string
          overall_tone?: string | null
          owner_id?: string
          rules_constraints?: string | null
          scope_scale?: string | null
          settings?: Json | null
          societal_overview?: string | null
          technology_level?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aesthetic_direction?: string | null
          audience_rating?: string | null
          calendar_timekeeping?: string | null
          climate_biomes?: string[] | null
          conflict_drivers?: string[] | null
          cosmology_model?: string | null
          created_at?: string
          description?: string | null
          genre_blend?: string[] | null
          id?: string
          is_archived?: boolean | null
          is_public?: boolean | null
          key_themes?: string[] | null
          logline?: string | null
          magic_level?: string[] | null
          name?: string
          overall_tone?: string | null
          owner_id?: string
          rules_constraints?: string | null
          scope_scale?: string | null
          settings?: Json | null
          societal_overview?: string | null
          technology_level?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_has_world_access: {
        Args: { user_uuid: string; world_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      world_member_role: "viewer" | "editor" | "admin"
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
      world_member_role: ["viewer", "editor", "admin"],
    },
  },
} as const
