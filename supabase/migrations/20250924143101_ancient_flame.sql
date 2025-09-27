/*
  # Sri Lanka Temple Devotee Committee Schema Updates

  1. Schema Updates
    - Update user_profiles table with temple-specific fields
    - Rename notes table to devotee_records with temple-specific fields
    - Rename calendar_events to temple_events with ceremony types
    - Update enum types for temple context

  2. New Fields
    - NIC number, address, occupation, emergency contact
    - Temple join date, donation history
    - Event types for temple ceremonies
    - Record types for prayers, donations, service

  3. Security
    - Update RLS policies for new table names
    - Maintain existing security model
*/

-- Update enum types for temple context
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'temple_user_role') THEN
    CREATE TYPE temple_user_role AS ENUM ('devotee', 'committee', 'admin');
  END IF;
END $$;

-- Update the user_profiles table to use the new enum type
ALTER TABLE user_profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE user_profiles ALTER COLUMN role TYPE temple_user_role USING role::text::temple_user_role;
ALTER TABLE user_profiles ALTER COLUMN role SET DEFAULT 'devotee'::temple_user_role;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_type') THEN
    CREATE TYPE record_type AS ENUM ('prayer', 'donation', 'service', 'note');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE event_type AS ENUM ('poya_day', 'ceremony', 'festival', 'meeting', 'other');
  END IF;
END $$;

-- Add new columns to user_profiles table
DO $$
BEGIN
  -- Add NIC number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'nic_number'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN nic_number text;
  END IF;

  -- Add address
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN address text;
  END IF;

  -- Add email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email text;
  END IF;

  -- Add date of birth
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN date_of_birth date;
  END IF;

  -- Add occupation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'occupation'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN occupation text;
  END IF;

  -- Add emergency contact
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'emergency_contact'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN emergency_contact text;
  END IF;

  -- Add temple join date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'temple_join_date'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN temple_join_date date;
  END IF;

  -- Add donation history
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'donation_history'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN donation_history jsonb;
  END IF;
END $$;

-- Create devotee_records table (renamed from notes)
CREATE TABLE IF NOT EXISTS devotee_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  record_type record_type DEFAULT 'note',
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  amount decimal(10,2),
  date_recorded date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create temple_events table (renamed from calendar_events)
CREATE TABLE IF NOT EXISTS temple_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_type event_type DEFAULT 'other',
  title text NOT NULL,
  description text DEFAULT '',
  location text,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  all_day boolean DEFAULT false,
  max_participants integer,
  registration_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create triggers for updated_at
CREATE TRIGGER update_devotee_records_updated_at 
  BEFORE UPDATE ON devotee_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_temple_events_updated_at 
  BEFORE UPDATE ON temple_events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE devotee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_events ENABLE ROW LEVEL SECURITY;

-- Update helper functions for temple context
CREATE OR REPLACE FUNCTION is_committee(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id AND (role::text = 'committee' OR role::text = 'admin') AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for devotee_records
CREATE POLICY "Devotees can manage their own records"
  ON devotee_records FOR ALL
  TO authenticated
  USING (user_id = auth.uid() AND is_approved(auth.uid()));

CREATE POLICY "Committee can manage all records"
  ON devotee_records FOR ALL
  TO authenticated
  USING (is_committee(auth.uid()));

-- RLS Policies for temple_events
CREATE POLICY "Devotees can view all events"
  ON temple_events FOR SELECT
  TO authenticated
  USING (is_approved(auth.uid()));

CREATE POLICY "Committee can manage all events"
  ON temple_events FOR ALL
  TO authenticated
  USING (is_committee(auth.uid()));

-- Update activity logging for new tables
CREATE OR REPLACE FUNCTION log_devotee_records_changes()
RETURNS trigger AS $$
DECLARE
  admin_user_id uuid;
  action_description text;
BEGIN
  admin_user_id := auth.uid();
  
  IF TG_OP = 'DELETE' THEN
    IF admin_user_id = OLD.user_id THEN
      action_description := 'Devotee deleted their own record';
    ELSE
      action_description := 'Committee deleted devotee record';
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
    IF admin_user_id = NEW.user_id THEN
      action_description := 'Devotee modified their own record';
    ELSE
      action_description := 'Committee modified devotee record';
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

CREATE OR REPLACE FUNCTION log_temple_events_changes()
RETURNS trigger AS $$
DECLARE
  admin_user_id uuid;
  action_description text;
BEGIN
  admin_user_id := auth.uid();
  
  IF TG_OP = 'DELETE' THEN
    action_description := 'Committee deleted temple event';
    
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
      admin_user_id,
      TG_OP,
      TG_TABLE_NAME,
      OLD.id::text,
      to_jsonb(OLD),
      NULL,
      action_description
    );
    
    RETURN OLD;
  ELSE
    action_description := 'Committee modified temple event';
    
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
      admin_user_id,
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

-- Create triggers for new tables
DROP TRIGGER IF EXISTS log_devotee_records_changes_trigger ON devotee_records;
CREATE TRIGGER log_devotee_records_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON devotee_records
  FOR EACH ROW EXECUTE FUNCTION log_devotee_records_changes();

DROP TRIGGER IF EXISTS log_temple_events_changes_trigger ON temple_events;
CREATE TRIGGER log_temple_events_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON temple_events
  FOR EACH ROW EXECUTE FUNCTION log_temple_events_changes();

-- Update the profile creation function for temple context
CREATE OR REPLACE FUNCTION create_temple_profile()
RETURNS trigger AS $$
BEGIN
  -- Only create admin if this is the first user
  IF (SELECT COUNT(*) FROM user_profiles WHERE role::text = 'admin') = 0 THEN
    INSERT INTO user_profiles (
      id, 
      full_name, 
      role, 
      status,
      nic_number,
      address,
      phone,
      email
    ) VALUES (
      NEW.id, 
      'Temple Administrator', 
      'admin'::temple_user_role, 
      'approved',
      NEW.raw_user_meta_data->>'nic_number',
      NEW.raw_user_meta_data->>'address',
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'email'
    );
  ELSE
    INSERT INTO user_profiles (
      id, 
      full_name, 
      role, 
      status,
      nic_number,
      address,
      phone,
      email
    ) VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Devotee'), 
      'devotee'::temple_user_role, 
      'pending',
      NEW.raw_user_meta_data->>'nic_number',
      NEW.raw_user_meta_data->>'address',
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'email'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_temple_profile();