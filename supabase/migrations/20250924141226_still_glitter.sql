/*
  # Add Activity Logging System

  1. New Tables
    - `activity_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `admin_id` (uuid, references user_profiles, nullable)
      - `action` (text) - type of action performed
      - `table_name` (text) - which table was affected
      - `record_id` (text) - ID of the affected record
      - `old_values` (jsonb) - previous values
      - `new_values` (jsonb) - new values
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on activity_logs table
    - Users can view their own activity logs
    - Admins can view all activity logs

  3. Functions
    - Function to log profile changes
    - Trigger to automatically log user_profiles changes
*/

-- Create activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_logs
CREATE POLICY "Users can view their own activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to log user profile changes
CREATE OR REPLACE FUNCTION log_user_profile_changes()
RETURNS trigger AS $$
DECLARE
  admin_user_id uuid;
  action_description text;
BEGIN
  -- Get the current user (could be admin editing another user's profile)
  admin_user_id := auth.uid();
  
  -- Determine if this is a self-edit or admin edit
  IF admin_user_id = NEW.id THEN
    action_description := 'User updated their own profile';
  ELSE
    action_description := 'Admin updated user profile';
  END IF;

  -- Log the change
  INSERT INTO activity_logs (
    user_id,
    admin_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    description
  ) VALUES (
    NEW.id,
    CASE WHEN admin_user_id != NEW.id THEN admin_user_id ELSE NULL END,
    TG_OP,
    TG_TABLE_NAME,
    NEW.id::text,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW),
    action_description
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user profile changes
DROP TRIGGER IF EXISTS log_user_profile_changes_trigger ON user_profiles;
CREATE TRIGGER log_user_profile_changes_trigger
  AFTER INSERT OR UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION log_user_profile_changes();

-- Function to log notes changes
CREATE OR REPLACE FUNCTION log_notes_changes()
RETURNS trigger AS $$
DECLARE
  admin_user_id uuid;
  action_description text;
BEGIN
  admin_user_id := auth.uid();
  
  IF admin_user_id = NEW.user_id THEN
    action_description := 'User modified their own note';
  ELSE
    action_description := 'Admin modified user note';
  END IF;

  INSERT INTO activity_logs (
    user_id,
    admin_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    description
  ) VALUES (
    NEW.user_id,
    CASE WHEN admin_user_id != NEW.user_id THEN admin_user_id ELSE NULL END,
    TG_OP,
    TG_TABLE_NAME,
    NEW.id::text,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW),
    action_description
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for notes changes
DROP TRIGGER IF EXISTS log_notes_changes_trigger ON notes;
CREATE TRIGGER log_notes_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON notes
  FOR EACH ROW EXECUTE FUNCTION log_notes_changes();

-- Function to log calendar events changes
CREATE OR REPLACE FUNCTION log_calendar_changes()
RETURNS trigger AS $$
DECLARE
  admin_user_id uuid;
  action_description text;
  target_user_id uuid;
BEGIN
  admin_user_id := auth.uid();
  
  -- Handle DELETE case
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
    IF admin_user_id = OLD.user_id THEN
      action_description := 'User deleted their own calendar event';
    ELSE
      action_description := 'Admin deleted user calendar event';
    END IF;
    
    INSERT INTO activity_logs (
      user_id,
      admin_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values,
      description
    ) VALUES (
      OLD.user_id,
      CASE WHEN admin_user_id != OLD.user_id THEN admin_user_id ELSE NULL END,
      TG_OP,
      TG_TABLE_NAME,
      OLD.id::text,
      to_jsonb(OLD),
      NULL,
      action_description
    );
    
    RETURN OLD;
  ELSE
    target_user_id := NEW.user_id;
    IF admin_user_id = NEW.user_id THEN
      action_description := 'User modified their own calendar event';
    ELSE
      action_description := 'Admin modified user calendar event';
    END IF;
    
    INSERT INTO activity_logs (
      user_id,
      admin_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values,
      description
    ) VALUES (
      NEW.user_id,
      CASE WHEN admin_user_id != NEW.user_id THEN admin_user_id ELSE NULL END,
      TG_OP,
      TG_TABLE_NAME,
      NEW.id::text,
      CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      to_jsonb(NEW),
      action_description
    );
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for calendar events changes
DROP TRIGGER IF EXISTS log_calendar_changes_trigger ON calendar_events;
CREATE TRIGGER log_calendar_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION log_calendar_changes();