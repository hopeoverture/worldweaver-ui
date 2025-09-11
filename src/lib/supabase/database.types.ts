export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          username: string | null
          bio: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          bio?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          bio?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      worlds: {
        Row: {
          id: string
          name: string
          description: string | null
          cover_image: string | null
          owner_id: string
          is_public: boolean
          is_archived: boolean
          settings: unknown
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          cover_image?: string | null
          owner_id: string
          is_public?: boolean
          is_archived?: boolean
          settings?: unknown
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          cover_image?: string | null
          owner_id?: string
          is_public?: boolean
          is_archived?: boolean
          settings?: unknown
          created_at?: string
          updated_at?: string
        }
      }
      world_members: {
        Row: {
          id: string
          world_id: string
          user_id: string
          role: 'owner' | 'admin' | 'editor' | 'viewer'
          permissions: unknown
          joined_at: string
        }
        Insert: {
          id?: string
          world_id: string
          user_id: string
          role: 'owner' | 'admin' | 'editor' | 'viewer'
          permissions?: unknown
          joined_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'editor' | 'viewer'
          permissions?: unknown
          joined_at?: string
        }
      }
      world_invites: {
        Row: {
          id: string
          world_id: string
          email: string
          role: 'admin' | 'editor' | 'viewer'
          invited_by: string
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          world_id: string
          email: string
          role: 'admin' | 'editor' | 'viewer'
          invited_by: string
          token: string
          expires_at: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          email?: string
          role?: 'admin' | 'editor' | 'viewer'
          invited_by?: string
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          category: string | null
          fields: unknown
          is_system: boolean
          world_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          category?: string | null
          fields?: unknown
          is_system?: boolean
          world_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          category?: string | null
          fields?: unknown
          is_system?: boolean
          world_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      entities: {
        Row: {
          id: string
          name: string
          description: string | null
          template_id: string | null
          world_id: string
          folder_id: string | null
          data: unknown
          image_url: string | null
          tags: string[] | null
          is_archived: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          template_id?: string | null
          world_id: string
          folder_id?: string | null
          data?: unknown
          image_url?: string | null
          tags?: string[] | null
          is_archived?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          template_id?: string | null
          world_id?: string
          folder_id?: string | null
          data?: unknown
          image_url?: string | null
          tags?: string[] | null
          is_archived?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
          world_id: string
          color: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
          world_id: string
          color?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          world_id?: string
          color?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      relationships: {
        Row: {
          id: string
          from_entity_id: string
          to_entity_id: string
          relationship_type: string
          description: string | null
          strength: number
          is_bidirectional: boolean
          world_id: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          from_entity_id: string
          to_entity_id: string
          relationship_type: string
          description?: string | null
          strength?: number
          is_bidirectional?: boolean
          world_id: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          from_entity_id?: string
          to_entity_id?: string
          relationship_type?: string
          description?: string | null
          strength?: number
          is_bidirectional?: boolean
          world_id?: string
          created_by?: string | null
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          world_id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          details: unknown
          created_at: string
        }
        Insert: {
          id?: string
          world_id: string
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          details?: unknown
          created_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          user_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          details?: unknown
          created_at?: string
        }
      }
      world_files: {
        Row: {
          id: string
          world_id: string
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          world_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
