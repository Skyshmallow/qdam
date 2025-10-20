export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      nodes: {
        Row: {
          id: string
          user_id: string
          coordinates: Json
          location: unknown | null
          is_temporary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          coordinates: Json
          is_temporary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          coordinates?: Json
          is_temporary?: boolean
          updated_at?: string
        }
      }
      chains: {
        Row: {
          id: string
          user_id: string
          node_a_id: string | null
          node_b_id: string | null
          path: Json
          simplified_path: Json | null
          distance_km: number | null
          is_temporary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          node_a_id?: string | null
          node_b_id?: string | null
          path: Json
          is_temporary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          node_a_id?: string | null
          node_b_id?: string | null
          path?: Json
          is_temporary?: boolean
          updated_at?: string
        }
      }
      territories: {
        Row: {
          id: string
          user_id: string
          polygon: Json
          area: unknown | null
          area_km2: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          polygon: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          polygon?: Json
          updated_at?: string
        }
      }
      player_stats: {
        Row: {
          user_id: string
          chains_created_today: number
          last_chain_date: string | null
          total_chains: number
          total_nodes: number
          total_distance_km: number
          current_territory_km2: number
          max_territory_km2: number
          longest_chain_km: number
          rank: number | null
          score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          chains_created_today?: number
          last_chain_date?: string | null
          total_chains?: number
          total_nodes?: number
          total_distance_km?: number
          current_territory_km2?: number
          max_territory_km2?: number
          longest_chain_km?: number
          rank?: number | null
          score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          chains_created_today?: number
          last_chain_date?: string | null
          total_chains?: number
          total_nodes?: number
          total_distance_km?: number
          current_territory_km2?: number
          max_territory_km2?: number
          longest_chain_km?: number
          rank?: number | null
          score?: number
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          user_id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          territory_color: string
          show_live_position: boolean
          show_detailed_routes: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          territory_color?: string
          show_live_position?: boolean
          show_detailed_routes?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          territory_color?: string
          show_live_position?: boolean
          show_detailed_routes?: boolean
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          icon_url: string | null
          points: number
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          icon_url?: string | null
          points?: number
          created_at?: string
        }
        Update: {
          code?: string
          name?: string
          description?: string | null
          icon_url?: string | null
          points?: number
        }
      }
      user_achievements: {
        Row: {
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          earned_at?: string
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
  }
}