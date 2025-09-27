/*
  # Comprehensive fix for RLS policies and permissions
  
  This migration ensures that:
  1. RLS policies are properly configured
  2. Permissions are granted to authenticated users
  3. The profile loading issue is resolved
*/

-- First, ensure we have the proper permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_profiles TO authenticated;
GRANT SELECT, INSERT ON TABLE public.activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.devotee_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.temple_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.calendar_events TO authenticated;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_committee(uuid) TO authenticated;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temple_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can insert their profile on signup" ON public.user_profiles;

-- Recreate RLS policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can insert their profile on signup"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Recreate policies for activity_logs
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;

CREATE POLICY "Users can view their own activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Recreate policies for devotee_records
DROP POLICY IF EXISTS "Devotees can manage their own records" ON public.devotee_records;
DROP POLICY IF EXISTS "Committee can manage all records" ON public.devotee_records;

CREATE POLICY "Devotees can manage their own records"
  ON public.devotee_records FOR ALL
  TO authenticated
  USING (user_id = auth.uid() AND is_approved(auth.uid()));

CREATE POLICY "Committee can manage all records"
  ON public.devotee_records FOR ALL
  TO authenticated
  USING (is_committee(auth.uid()));

-- Recreate policies for temple_events
DROP POLICY IF EXISTS "Devotees can view all events" ON public.temple_events;
DROP POLICY IF EXISTS "Committee can manage all events" ON public.temple_events;

CREATE POLICY "Devotees can view all events"
  ON public.temple_events FOR SELECT
  TO authenticated
  USING (is_approved(auth.uid()));

CREATE POLICY "Committee can manage all events"
  ON public.temple_events FOR ALL
  TO authenticated
  USING (is_committee(auth.uid()));

-- Recreate policies for notes
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.notes;
DROP POLICY IF EXISTS "Admins can manage all notes" ON public.notes;

CREATE POLICY "Users can manage their own notes"
  ON public.notes FOR ALL
  TO authenticated
  USING (user_id = auth.uid() AND is_approved(auth.uid()));

CREATE POLICY "Admins can manage all notes"
  ON public.notes FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Recreate policies for calendar_events
DROP POLICY IF EXISTS "Users can manage their own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins can manage all events" ON public.calendar_events;

CREATE POLICY "Users can manage their own events"
  ON public.calendar_events FOR ALL
  TO authenticated
  USING (user_id = auth.uid() AND is_approved(auth.uid()));

CREATE POLICY "Admins can manage all events"
  ON public.calendar_events FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));
