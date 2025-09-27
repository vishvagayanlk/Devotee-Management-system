/*
  # Fix table permissions for authenticated users
  
  The previous migrations revoked all permissions from authenticated users.
  This migration restores the necessary permissions while keeping RLS policies in place.
*/

-- Grant necessary permissions to authenticated users for user_profiles
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_profiles TO authenticated;

-- Grant necessary permissions to authenticated users for activity_logs
GRANT SELECT, INSERT ON TABLE public.activity_logs TO authenticated;

-- Grant necessary permissions to authenticated users for devotee_records
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.devotee_records TO authenticated;

-- Grant necessary permissions to authenticated users for temple_events
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.temple_events TO authenticated;

-- Grant necessary permissions to authenticated users for notes (if still exists)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notes TO authenticated;

-- Grant necessary permissions to authenticated users for calendar_events (if still exists)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.calendar_events TO authenticated;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_committee(uuid) TO authenticated;
