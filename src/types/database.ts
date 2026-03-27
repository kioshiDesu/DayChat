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
      rooms: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          is_public: boolean
          invite_code: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          is_public: boolean
          invite_code: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string | null
          is_public?: boolean
          invite_code?: string
          expires_at?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          content: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          content: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          content?: string
          expires_at?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          message_id: string
          reporter_id: string
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          reporter_id: string
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          reporter_id?: string
          reason?: string
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
  }
}
