import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging to help troubleshoot configuration
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Missing');
console.log('Supabase URL value:', supabaseUrl);
console.log('Supabase Anon Key length:', supabaseAnonKey?.length);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          clerk_id: string | null;
          full_name: string;
          first_name: string | null;
          last_name: string | null;
          role: 'devotee' | 'committee' | 'admin' | 'super_admin';
          status: 'pending' | 'approved' | 'rejected';
          is_approved: boolean;
          nic_number: string | null;
          address: string | null;
          phone: string | null;
          phone_number: string | null;
          email: string | null;
          date_of_birth: string | null;
          occupation: string | null;
          emergency_contact: string | null;
          temple_join_date: string | null;
          donation_history: any | null;
          bio: string | null;
          group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          clerk_id?: string | null;
          full_name: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: 'devotee' | 'committee' | 'admin' | 'super_admin';
          status?: 'pending' | 'approved' | 'rejected';
          is_approved?: boolean;
          nic_number?: string | null;
          address?: string | null;
          phone?: string | null;
          phone_number?: string | null;
          email?: string | null;
          date_of_birth?: string | null;
          occupation?: string | null;
          emergency_contact?: string | null;
          temple_join_date?: string | null;
          donation_history?: any | null;
          bio?: string | null;
          group_id?: string | null;
        };
        Update: {
          clerk_id?: string | null;
          full_name?: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: 'devotee' | 'committee' | 'admin' | 'super_admin';
          nic_number?: string | null;
          address?: string | null;
          phone?: string | null;
          phone_number?: string | null;
          email?: string | null;
          date_of_birth?: string | null;
          occupation?: string | null;
          emergency_contact?: string | null;
          temple_join_date?: string | null;
          donation_history?: any | null;
          bio?: string | null;
          group_id?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          is_approved?: boolean;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          color?: string;
          is_active?: boolean;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          color?: string;
          is_active?: boolean;
        };
      };
      event_assignments: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          event_id: string;
          user_id: string;
          assigned_by?: string | null;
        };
        Update: {
          assigned_by?: string | null;
        };
      };
      group_event_assignments: {
        Row: {
          id: string;
          event_id: string;
          group_id: string;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          event_id: string;
          group_id: string;
          assigned_by?: string | null;
        };
        Update: {
          assigned_by?: string | null;
        };
      };
      devotee_records: {
        Row: {
          id: string;
          user_id: string;
          record_type: 'prayer' | 'donation' | 'service' | 'note';
          title: string;
          content: string;
          amount: number | null;
          date_recorded: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          record_type: 'prayer' | 'donation' | 'service' | 'note';
          title: string;
          content: string;
          amount?: number | null;
          date_recorded?: string;
        };
        Update: {
          record_type?: 'prayer' | 'donation' | 'service' | 'note';
          title?: string;
          content?: string;
          amount?: number | null;
          date_recorded?: string;
        };
      };
      temple_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: 'poya_day' | 'ceremony' | 'festival' | 'meeting' | 'other';
          title: string;
          description: string | null;
          location: string | null;
          start_date: string;
          end_date: string | null;
          all_day: boolean;
          max_participants: number | null;
          registration_required: boolean;
          is_assigned_only: boolean;
          assignment_type: 'all' | 'specific' | 'group';
          is_recurring: boolean;
          recurrence_type: 'monthly' | 'weekly' | 'yearly' | null;
          recurrence_interval: number | null;
          recurrence_end_date: string | null;
          parent_event_id: string | null;
          recurrence_rule: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          event_type: 'poya_day' | 'ceremony' | 'festival' | 'meeting' | 'other';
          title: string;
          description?: string | null;
          location?: string | null;
          start_date: string;
          end_date?: string | null;
          all_day?: boolean;
          max_participants?: number | null;
          registration_required?: boolean;
          is_assigned_only?: boolean;
          assignment_type?: 'all' | 'specific' | 'group';
          is_recurring?: boolean;
          recurrence_type?: 'monthly' | 'weekly' | 'yearly' | null;
          recurrence_interval?: number | null;
          recurrence_end_date?: string | null;
          parent_event_id?: string | null;
          recurrence_rule?: any | null;
        };
        Update: {
          event_type?: 'poya_day' | 'ceremony' | 'festival' | 'meeting' | 'other';
          title?: string;
          description?: string | null;
          location?: string | null;
          start_date?: string;
          end_date?: string | null;
          all_day?: boolean;
          max_participants?: number | null;
          registration_required?: boolean;
          is_assigned_only?: boolean;
          assignment_type?: 'all' | 'specific' | 'group';
          is_recurring?: boolean;
          recurrence_type?: 'monthly' | 'weekly' | 'yearly' | null;
          recurrence_interval?: number | null;
          recurrence_end_date?: string | null;
          parent_event_id?: string | null;
          recurrence_rule?: any | null;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          admin_id: string | null;
          action: string;
          table_name: string;
          record_id: string;
          old_values: any;
          new_values: any;
          description: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          admin_id?: string | null;
          action: string;
          table_name: string;
          record_id: string;
          old_values?: any;
          new_values?: any;
          description?: string;
        };
        Update: {
          description?: string;
        };
      };
      temple_settings: {
        Row: {
          id: string;
          temple_name: string;
          temple_description: string | null;
          temple_logo_url: string | null;
          temple_address: string | null;
          temple_phone: string | null;
          temple_email: string | null;
          temple_website: string | null;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          background_color: string;
          text_color: string;
          font_family: string;
          theme_name: string;
          custom_css: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          temple_name?: string;
          temple_description?: string | null;
          temple_logo_url?: string | null;
          temple_address?: string | null;
          temple_phone?: string | null;
          temple_email?: string | null;
          temple_website?: string | null;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          background_color?: string;
          text_color?: string;
          font_family?: string;
          theme_name?: string;
          custom_css?: string | null;
          is_active?: boolean;
          created_by?: string | null;
        };
        Update: {
          temple_name?: string;
          temple_description?: string | null;
          temple_logo_url?: string | null;
          temple_address?: string | null;
          temple_phone?: string | null;
          temple_email?: string | null;
          temple_website?: string | null;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          background_color?: string;
          text_color?: string;
          font_family?: string;
          theme_name?: string;
          custom_css?: string | null;
          is_active?: boolean;
        };
      };
      themes: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          background_color: string;
          text_color: string;
          font_family: string;
          preview_image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          display_name: string;
          description?: string | null;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          background_color: string;
          text_color: string;
          font_family?: string;
          preview_image_url?: string | null;
          is_active?: boolean;
        };
        Update: {
          display_name?: string;
          description?: string | null;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          background_color?: string;
          text_color?: string;
          font_family?: string;
          preview_image_url?: string | null;
          is_active?: boolean;
        };
      };
    };
  };
};