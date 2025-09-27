/*
  # Add Groups and Event Assignment System
  
  This migration adds:
  1. Groups/teams system for organizing devotees
  2. Event assignment to specific users
  3. Group management capabilities
*/

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6', -- Default blue color
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add group_id to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE SET NULL;

-- Create event_assignments table for assigning events to specific users
CREATE TABLE IF NOT EXISTS event_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES temple_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create group_event_assignments table for assigning events to entire groups
CREATE TABLE IF NOT EXISTS group_event_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES temple_events(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(event_id, group_id)
);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_groups_updated_at 
  BEFORE UPDATE ON groups 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_event_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "Everyone can view active groups"
  ON groups FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Committee can manage all groups"
  ON groups FOR ALL
  TO authenticated
  USING (is_committee(auth.uid()));

-- RLS Policies for event_assignments
CREATE POLICY "Users can view their own event assignments"
  ON event_assignments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Committee can manage all event assignments"
  ON event_assignments FOR ALL
  TO authenticated
  USING (is_committee(auth.uid()));

-- RLS Policies for group_event_assignments
CREATE POLICY "Users can view group event assignments for their group"
  ON group_event_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND group_id = group_event_assignments.group_id
    )
  );

CREATE POLICY "Committee can manage all group event assignments"
  ON group_event_assignments FOR ALL
  TO authenticated
  USING (is_committee(auth.uid()));

-- Create some default groups
INSERT INTO groups (name, description, color) VALUES
  ('General Members', 'General temple devotees', '#3B82F6'),
  ('Youth Group', 'Young devotees and volunteers', '#10B981'),
  ('Senior Members', 'Elderly devotees and long-time members', '#F59E0B'),
  ('Volunteers', 'Active volunteers and helpers', '#8B5CF6'),
  ('New Members', 'Recently joined devotees', '#EF4444');

-- Update the temple_events table to support assignments
ALTER TABLE temple_events ADD COLUMN IF NOT EXISTS is_assigned_only boolean DEFAULT false;
ALTER TABLE temple_events ADD COLUMN IF NOT EXISTS assignment_type text DEFAULT 'all' CHECK (assignment_type IN ('all', 'specific', 'group'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_group_id ON user_profiles(group_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_user_id ON event_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_event_id ON event_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_group_event_assignments_group_id ON group_event_assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_group_event_assignments_event_id ON group_event_assignments(event_id);
