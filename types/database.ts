/**
 * Database Types for Supabase - Shared Database
 *
 * This CRM uses the shared Supabase database with cornerstone-callbot and ctg-v1.
 * CRM tables are prefixed with 'crm_' and integrate with existing workspaces.
 *
 * TODO: Generate these types from Supabase CLI using:
 * npx supabase gen types typescript --project-id <your-project-id> > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ============================================
      // EXISTING TABLES (from cornerstone-callbot)
      // ============================================
      workspaces: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          slug: string | null;
          logo_url: string | null;
          settings: Json;
          metadata: Json;
          is_active: boolean;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          slug?: string | null;
          logo_url?: string | null;
          settings?: Json;
          metadata?: Json;
          is_active?: boolean;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          slug?: string | null;
          logo_url?: string | null;
          settings?: Json;
          metadata?: Json;
          is_active?: boolean;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member" | "viewer";
          permissions: string[];
          status: "active" | "pending" | "inactive" | "suspended";
          invited_by: string | null;
          invited_at: string;
          joined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member" | "viewer";
          permissions?: string[];
          status?: "active" | "pending" | "inactive" | "suspended";
          invited_by?: string | null;
          invited_at?: string;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member" | "viewer";
          permissions?: string[];
          status?: "active" | "pending" | "inactive" | "suspended";
          invited_by?: string | null;
          invited_at?: string;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      calls: {
        Row: {
          id: string;
          user_id: string;
          callbot_id: string;
          call_sid: string | null;
          phone_number: string;
          direction: "inbound" | "outbound";
          status: string;
          duration: number;
          recording_url: string | null;
          transcript: string | null;
          summary: string | null;
          sentiment: "positive" | "negative" | "neutral" | "mixed" | null;
          cost: number;
          currency: string;
          messages_count: number;
          tokens_used: number;
          tags: string[] | null;
          notes: string | null;
          metadata: Json;
          started_at: string | null;
          answered_at: string | null;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          callbot_id: string;
          call_sid?: string | null;
          phone_number: string;
          direction: "inbound" | "outbound";
          status?: string;
          duration?: number;
          recording_url?: string | null;
          transcript?: string | null;
          summary?: string | null;
          sentiment?: "positive" | "negative" | "neutral" | "mixed" | null;
          cost?: number;
          currency?: string;
          messages_count?: number;
          tokens_used?: number;
          tags?: string[] | null;
          notes?: string | null;
          metadata?: Json;
          started_at?: string | null;
          answered_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          callbot_id?: string;
          call_sid?: string | null;
          phone_number?: string;
          direction?: "inbound" | "outbound";
          status?: string;
          duration?: number;
          recording_url?: string | null;
          transcript?: string | null;
          summary?: string | null;
          sentiment?: "positive" | "negative" | "neutral" | "mixed" | null;
          cost?: number;
          currency?: string;
          messages_count?: number;
          tokens_used?: number;
          tags?: string[] | null;
          notes?: string | null;
          metadata?: Json;
          started_at?: string | null;
          answered_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sms_messages: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string | null;
          phone_number_id: string | null;
          external_id: string | null;
          direction: "inbound" | "outbound";
          from_number: string;
          to_number: string;
          body: string;
          status: string;
          error_code: string | null;
          error_message: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          conversation_id?: string | null;
          phone_number_id?: string | null;
          external_id?: string | null;
          direction: "inbound" | "outbound";
          from_number: string;
          to_number: string;
          body: string;
          status?: string;
          error_code?: string | null;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          conversation_id?: string | null;
          phone_number_id?: string | null;
          external_id?: string | null;
          direction?: "inbound" | "outbound";
          from_number?: string;
          to_number?: string;
          body?: string;
          status?: string;
          error_code?: string | null;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ============================================
      // CRM TABLES
      // ============================================
      crm_contacts: {
        Row: {
          id: string;
          workspace_id: string;
          assigned_to: string | null;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          type: "buyer" | "seller" | "both" | "investor" | "other";
          status: "active" | "inactive" | "archived";
          source: string | null;
          source_detail: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          country: string;
          company_name: string | null;
          job_title: string | null;
          tags: string[];
          custom_fields: Json;
          last_contacted_at: string | null;
          lead_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          assigned_to?: string | null;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          type?: "buyer" | "seller" | "both" | "investor" | "other";
          status?: "active" | "inactive" | "archived";
          source?: string | null;
          source_detail?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string;
          company_name?: string | null;
          job_title?: string | null;
          tags?: string[];
          custom_fields?: Json;
          last_contacted_at?: string | null;
          lead_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          assigned_to?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          type?: "buyer" | "seller" | "both" | "investor" | "other";
          status?: "active" | "inactive" | "archived";
          source?: string | null;
          source_detail?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string;
          company_name?: string | null;
          job_title?: string | null;
          tags?: string[];
          custom_fields?: Json;
          last_contacted_at?: string | null;
          lead_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_contacts_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contacts_assigned_to_fkey";
            columns: ["assigned_to"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      crm_pipelines: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          is_default: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_pipelines_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
      crm_pipeline_stages: {
        Row: {
          id: string;
          pipeline_id: string;
          name: string;
          position: number;
          color: string;
          probability: number | null;
          is_won_stage: boolean;
          is_lost_stage: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pipeline_id: string;
          name: string;
          position: number;
          color?: string;
          probability?: number | null;
          is_won_stage?: boolean;
          is_lost_stage?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pipeline_id?: string;
          name?: string;
          position?: number;
          color?: string;
          probability?: number | null;
          is_won_stage?: boolean;
          is_lost_stage?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_pipeline_id_fkey";
            columns: ["pipeline_id"];
            referencedRelation: "crm_pipelines";
            referencedColumns: ["id"];
          }
        ];
      };
      crm_deals: {
        Row: {
          id: string;
          workspace_id: string;
          pipeline_id: string;
          stage_id: string;
          contact_id: string;
          assigned_to: string | null;
          title: string;
          description: string | null;
          value: number | null;
          expected_close_date: string | null;
          actual_close_date: string | null;
          status: "open" | "won" | "lost";
          lost_reason: string | null;
          won_date: string | null;
          lost_date: string | null;
          property_address: string | null;
          property_city: string | null;
          property_state: string | null;
          property_zip: string | null;
          property_type: string | null;
          property_bedrooms: number | null;
          property_bathrooms: number | null;
          property_sqft: number | null;
          property_year_built: number | null;
          property_list_price: number | null;
          property_mls_number: string | null;
          commission_rate: number | null;
          commission_amount: number | null;
          commission_split: Json;
          tags: string[];
          custom_fields: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          pipeline_id: string;
          stage_id: string;
          contact_id: string;
          assigned_to?: string | null;
          title: string;
          description?: string | null;
          value?: number | null;
          expected_close_date?: string | null;
          actual_close_date?: string | null;
          status?: "open" | "won" | "lost";
          lost_reason?: string | null;
          won_date?: string | null;
          lost_date?: string | null;
          property_address?: string | null;
          property_city?: string | null;
          property_state?: string | null;
          property_zip?: string | null;
          property_type?: string | null;
          property_bedrooms?: number | null;
          property_bathrooms?: number | null;
          property_sqft?: number | null;
          property_year_built?: number | null;
          property_list_price?: number | null;
          property_mls_number?: string | null;
          commission_rate?: number | null;
          commission_amount?: number | null;
          commission_split?: Json;
          tags?: string[];
          custom_fields?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          pipeline_id?: string;
          stage_id?: string;
          contact_id?: string;
          assigned_to?: string | null;
          title?: string;
          description?: string | null;
          value?: number | null;
          expected_close_date?: string | null;
          actual_close_date?: string | null;
          status?: "open" | "won" | "lost";
          lost_reason?: string | null;
          won_date?: string | null;
          lost_date?: string | null;
          property_address?: string | null;
          property_city?: string | null;
          property_state?: string | null;
          property_zip?: string | null;
          property_type?: string | null;
          property_bedrooms?: number | null;
          property_bathrooms?: number | null;
          property_sqft?: number | null;
          property_year_built?: number | null;
          property_list_price?: number | null;
          property_mls_number?: string | null;
          commission_rate?: number | null;
          commission_amount?: number | null;
          commission_split?: Json;
          tags?: string[];
          custom_fields?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_deals_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_deals_pipeline_id_fkey";
            columns: ["pipeline_id"];
            referencedRelation: "crm_pipelines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_deals_stage_id_fkey";
            columns: ["stage_id"];
            referencedRelation: "crm_pipeline_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_deals_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_deals_assigned_to_fkey";
            columns: ["assigned_to"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      crm_activities: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          contact_id: string | null;
          deal_id: string | null;
          call_id: string | null;
          type: "call" | "email" | "meeting" | "note" | "task" | "other";
          title: string;
          description: string | null;
          due_date: string | null;
          reminder_at: string | null;
          completed_at: string | null;
          outcome: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          contact_id?: string | null;
          deal_id?: string | null;
          call_id?: string | null;
          type: "call" | "email" | "meeting" | "note" | "task" | "other";
          title: string;
          description?: string | null;
          due_date?: string | null;
          reminder_at?: string | null;
          completed_at?: string | null;
          outcome?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          contact_id?: string | null;
          deal_id?: string | null;
          call_id?: string | null;
          type?: "call" | "email" | "meeting" | "note" | "task" | "other";
          title?: string;
          description?: string | null;
          due_date?: string | null;
          reminder_at?: string | null;
          completed_at?: string | null;
          outcome?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_activities_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_activities_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey";
            columns: ["deal_id"];
            referencedRelation: "crm_deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_activities_call_id_fkey";
            columns: ["call_id"];
            referencedRelation: "calls";
            referencedColumns: ["id"];
          }
        ];
      };
      crm_campaigns: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          name: string;
          description: string | null;
          type: "email" | "sms" | "drip";
          status: "draft" | "scheduled" | "active" | "paused" | "completed";
          subject_line: string | null;
          content_html: string | null;
          content_text: string | null;
          settings: Json;
          scheduled_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          recipients_count: number;
          sent_count: number;
          delivered_count: number;
          opened_count: number;
          clicked_count: number;
          bounced_count: number;
          unsubscribed_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          name: string;
          description?: string | null;
          type: "email" | "sms" | "drip";
          status?: "draft" | "scheduled" | "active" | "paused" | "completed";
          subject_line?: string | null;
          content_html?: string | null;
          content_text?: string | null;
          settings?: Json;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          recipients_count?: number;
          sent_count?: number;
          delivered_count?: number;
          opened_count?: number;
          clicked_count?: number;
          bounced_count?: number;
          unsubscribed_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          name?: string;
          description?: string | null;
          type?: "email" | "sms" | "drip";
          status?: "draft" | "scheduled" | "active" | "paused" | "completed";
          subject_line?: string | null;
          content_html?: string | null;
          content_text?: string | null;
          settings?: Json;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          recipients_count?: number;
          sent_count?: number;
          delivered_count?: number;
          opened_count?: number;
          clicked_count?: number;
          bounced_count?: number;
          unsubscribed_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_campaigns_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_campaigns_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      crm_campaign_contacts: {
        Row: {
          id: string;
          campaign_id: string;
          contact_id: string;
          status: string;
          sent_at: string | null;
          delivered_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          bounced_at: string | null;
          unsubscribed_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          contact_id: string;
          status?: string;
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          bounced_at?: string | null;
          unsubscribed_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          contact_id?: string;
          status?: string;
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          bounced_at?: string | null;
          unsubscribed_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_campaign_contacts_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "crm_campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_campaign_contacts_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          }
        ];
      };
      crm_workflows: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          name: string;
          description: string | null;
          trigger_type: string;
          trigger_config: Json;
          actions: Json;
          is_active: boolean;
          total_runs: number;
          successful_runs: number;
          failed_runs: number;
          last_run_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          name: string;
          description?: string | null;
          trigger_type: string;
          trigger_config?: Json;
          actions?: Json;
          is_active?: boolean;
          total_runs?: number;
          successful_runs?: number;
          failed_runs?: number;
          last_run_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          name?: string;
          description?: string | null;
          trigger_type?: string;
          trigger_config?: Json;
          actions?: Json;
          is_active?: boolean;
          total_runs?: number;
          successful_runs?: number;
          failed_runs?: number;
          last_run_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_workflows_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_workflows_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      crm_messages: {
        Row: {
          id: string;
          workspace_id: string;
          contact_id: string;
          user_id: string | null;
          campaign_id: string | null;
          sms_message_id: string | null;
          type: "email" | "sms";
          direction: "inbound" | "outbound";
          subject: string | null;
          content: string;
          status: "pending" | "sent" | "delivered" | "failed" | "opened" | "clicked";
          external_id: string | null;
          metadata: Json;
          sent_at: string | null;
          delivered_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          contact_id: string;
          user_id?: string | null;
          campaign_id?: string | null;
          sms_message_id?: string | null;
          type: "email" | "sms";
          direction: "inbound" | "outbound";
          subject?: string | null;
          content: string;
          status?: "pending" | "sent" | "delivered" | "failed" | "opened" | "clicked";
          external_id?: string | null;
          metadata?: Json;
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          contact_id?: string;
          user_id?: string | null;
          campaign_id?: string | null;
          sms_message_id?: string | null;
          type?: "email" | "sms";
          direction?: "inbound" | "outbound";
          subject?: string | null;
          content?: string;
          status?: "pending" | "sent" | "delivered" | "failed" | "opened" | "clicked";
          external_id?: string | null;
          metadata?: Json;
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_messages_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_messages_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_messages_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_messages_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "crm_campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_messages_sms_message_id_fkey";
            columns: ["sms_message_id"];
            referencedRelation: "sms_messages";
            referencedColumns: ["id"];
          }
        ];
      };
      crm_appointments: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          contact_id: string | null;
          deal_id: string | null;
          title: string;
          description: string | null;
          location: string | null;
          start_time: string;
          end_time: string;
          all_day: boolean;
          timezone: string;
          status: "scheduled" | "completed" | "cancelled" | "no_show";
          reminder_minutes: number[];
          reminder_sent: boolean;
          google_event_id: string | null;
          google_calendar_id: string | null;
          showing_type: string | null;
          showing_feedback: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          contact_id?: string | null;
          deal_id?: string | null;
          title: string;
          description?: string | null;
          location?: string | null;
          start_time: string;
          end_time: string;
          all_day?: boolean;
          timezone?: string;
          status?: "scheduled" | "completed" | "cancelled" | "no_show";
          reminder_minutes?: number[];
          reminder_sent?: boolean;
          google_event_id?: string | null;
          google_calendar_id?: string | null;
          showing_type?: string | null;
          showing_feedback?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          contact_id?: string | null;
          deal_id?: string | null;
          title?: string;
          description?: string | null;
          location?: string | null;
          start_time?: string;
          end_time?: string;
          all_day?: boolean;
          timezone?: string;
          status?: "scheduled" | "completed" | "cancelled" | "no_show";
          reminder_minutes?: number[];
          reminder_sent?: boolean;
          google_event_id?: string | null;
          google_calendar_id?: string | null;
          showing_type?: string | null;
          showing_feedback?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_appointments_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_appointments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_appointments_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_appointments_deal_id_fkey";
            columns: ["deal_id"];
            referencedRelation: "crm_deals";
            referencedColumns: ["id"];
          }
        ];
      };
      crm_notes: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          contact_id: string | null;
          deal_id: string | null;
          content: string;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          contact_id?: string | null;
          deal_id?: string | null;
          content: string;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          contact_id?: string | null;
          deal_id?: string | null;
          content?: string;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_notes_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_notes_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_notes_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_notes_deal_id_fkey";
            columns: ["deal_id"];
            referencedRelation: "crm_deals";
            referencedColumns: ["id"];
          }
        ];
      };
      crm_documents: {
        Row: {
          id: string;
          workspace_id: string;
          uploaded_by: string;
          contact_id: string | null;
          deal_id: string | null;
          name: string;
          description: string | null;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          document_type: string | null;
          docusign_envelope_id: string | null;
          docusign_status: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          uploaded_by: string;
          contact_id?: string | null;
          deal_id?: string | null;
          name: string;
          description?: string | null;
          file_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          document_type?: string | null;
          docusign_envelope_id?: string | null;
          docusign_status?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          uploaded_by?: string;
          contact_id?: string | null;
          deal_id?: string | null;
          name?: string;
          description?: string | null;
          file_path?: string;
          file_size?: number | null;
          mime_type?: string | null;
          document_type?: string | null;
          docusign_envelope_id?: string | null;
          docusign_status?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_documents_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_documents_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_documents_deal_id_fkey";
            columns: ["deal_id"];
            referencedRelation: "crm_deals";
            referencedColumns: ["id"];
          }
        ];
      };
      crm_audit_logs: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id?: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string | null;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_audit_logs_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_audit_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      crm_tags: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          color?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_tags_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      crm_contact_summary: {
        Row: {
          id: string;
          workspace_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          type: "buyer" | "seller" | "both" | "investor" | "other";
          status: "active" | "inactive" | "archived";
          assigned_to: string | null;
          last_contacted_at: string | null;
          lead_score: number;
          created_at: string;
          deals_count: number;
          activities_count: number;
          appointments_count: number;
          total_won_value: number;
        };
      };
      crm_deal_pipeline_view: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          value: number | null;
          status: "open" | "won" | "lost";
          expected_close_date: string | null;
          property_address: string | null;
          assigned_to: string | null;
          created_at: string;
          pipeline_name: string;
          stage_name: string;
          stage_position: number;
          stage_color: string;
          probability: number | null;
          contact_first_name: string;
          contact_last_name: string;
          contact_email: string | null;
          contact_phone: string | null;
        };
      };
    };
    Functions: {
      is_workspace_member: {
        Args: { ws_id: string };
        Returns: boolean;
      };
      is_workspace_admin: {
        Args: { ws_id: string };
        Returns: boolean;
      };
      get_user_workspaces: {
        Args: Record<string, never>;
        Returns: { workspace_id: string; workspace_name: string; role: string }[];
      };
      create_default_crm_pipeline: {
        Args: { ws_id: string };
        Returns: string;
      };
    };
    Enums: {
      crm_contact_type: "buyer" | "seller" | "both" | "investor" | "other";
      crm_contact_status: "active" | "inactive" | "archived";
      crm_deal_status: "open" | "won" | "lost";
      crm_activity_type: "call" | "email" | "meeting" | "note" | "task" | "other";
      crm_campaign_type: "email" | "sms" | "drip";
      crm_campaign_status: "draft" | "scheduled" | "active" | "paused" | "completed";
      crm_message_type: "email" | "sms";
      crm_message_direction: "inbound" | "outbound";
      crm_message_status: "pending" | "sent" | "delivered" | "failed" | "opened" | "clicked";
      crm_appointment_status: "scheduled" | "completed" | "cancelled" | "no_show";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

// Convenience type aliases - Existing tables
export type Workspace = Tables<"workspaces">;
export type WorkspaceMember = Tables<"workspace_members">;
export type Call = Tables<"calls">;
export type SmsMessage = Tables<"sms_messages">;

// Convenience type aliases - CRM tables
export type CrmContact = Tables<"crm_contacts">;
export type CrmPipeline = Tables<"crm_pipelines">;
export type CrmPipelineStage = Tables<"crm_pipeline_stages">;
export type CrmDeal = Tables<"crm_deals">;
export type CrmActivity = Tables<"crm_activities">;
export type CrmCampaign = Tables<"crm_campaigns">;
export type CrmCampaignContact = Tables<"crm_campaign_contacts">;
export type CrmWorkflow = Tables<"crm_workflows">;
export type CrmMessage = Tables<"crm_messages">;
export type CrmAppointment = Tables<"crm_appointments">;
export type CrmNote = Tables<"crm_notes">;
export type CrmDocument = Tables<"crm_documents">;
export type CrmAuditLog = Tables<"crm_audit_logs">;
export type CrmTag = Tables<"crm_tags">;

// View type aliases
export type CrmContactSummary = Views<"crm_contact_summary">;
export type CrmDealPipelineView = Views<"crm_deal_pipeline_view">;
