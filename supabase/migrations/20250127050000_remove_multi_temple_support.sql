-- Migration: Remove Multi-Temple Support
-- Description: Simplifies the system to work with a single temple by removing temple_id columns

-- Remove temple_id columns from all tables
ALTER TABLE user_profiles DROP COLUMN IF EXISTS temple_id;
ALTER TABLE devotee_records DROP COLUMN IF EXISTS temple_id;
ALTER TABLE temple_events DROP COLUMN IF EXISTS temple_id;

-- Remove temple_id from notes table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') THEN
    ALTER TABLE notes DROP COLUMN IF EXISTS temple_id;
  END IF;
END $$;

-- Remove temple_id from calendar_events table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    ALTER TABLE calendar_events DROP COLUMN IF EXISTS temple_id;
  END IF;
END $$;

-- Drop multi-temple functions
DROP FUNCTION IF EXISTS create_temple(text, text, text, text, text, text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS get_temple_by_id(uuid);
DROP FUNCTION IF EXISTS list_all_temples();
DROP FUNCTION IF EXISTS create_temple_admin(uuid, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS list_temple_admins(uuid);
DROP FUNCTION IF EXISTS list_temple_devotees(uuid);

-- Update RLS policies to remove temple isolation
DROP POLICY IF EXISTS "Users can view profiles in their temple" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles in their temple" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their temple" ON user_profiles;
DROP POLICY IF EXISTS "Devotees can manage their own records in their temple" ON devotee_records;
DROP POLICY IF EXISTS "Committee can manage all records in their temple" ON devotee_records;
DROP POLICY IF EXISTS "Users can manage their own events in their temple" ON temple_events;
DROP POLICY IF EXISTS "Committee can manage all events in their temple" ON temple_events;

-- Restore simple RLS policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert their profile on signup" ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Restore simple devotee_records policies
CREATE POLICY "Devotees can manage their own records" ON devotee_records FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() AND is_approved(auth.uid())
  );

CREATE POLICY "Committee can manage all records" ON devotee_records FOR ALL
  TO authenticated
  USING (is_committee(auth.uid()));

-- Restore simple temple_events policies
CREATE POLICY "Users can manage their own events" ON temple_events FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() AND is_approved(auth.uid())
  );

CREATE POLICY "Committee can manage all events" ON temple_events FOR ALL
  TO authenticated
  USING (is_committee(auth.uid()));

-- Add comment
COMMENT ON TABLE temple_settings IS 'Single temple configuration - simplified from multi-temple setup';
