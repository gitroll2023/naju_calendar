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
      events: {
        Row: {
          id: string
          title: string
          date: string
          start_time: string | null
          end_time: string | null
          category: string
          description: string | null
          location: string | null
          is_all_day: boolean
          reminder: number | null
          recurring: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          date: string
          start_time?: string | null
          end_time?: string | null
          category: string
          description?: string | null
          location?: string | null
          is_all_day?: boolean
          reminder?: number | null
          recurring?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          date?: string
          start_time?: string | null
          end_time?: string | null
          category?: string
          description?: string | null
          location?: string | null
          is_all_day?: boolean
          reminder?: number | null
          recurring?: string | null
          created_at?: string
          updated_at?: string
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
      church_category: 'church' | 'adult' | 'youth' | 'advisory' | 'women' | 'student' | 'children'
      recurring_type: 'daily' | 'weekly' | 'monthly' | 'yearly'
    }
  }
}