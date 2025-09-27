/*
  # Fix Delete Permissions for Devotee Management
  
  This migration ensures that committee members can delete devotee profiles.
*/

-- Ensure committee members can delete user profiles
CREATE POLICY "Committee can delete user profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (is_committee(auth.uid()));

-- Also ensure they can delete related records
CREATE POLICY "Committee can delete devotee records"
  ON devotee_records FOR DELETE
  TO authenticated
  USING (is_committee(auth.uid()));

-- Ensure they can delete activity logs
CREATE POLICY "Committee can delete activity logs"
  ON activity_logs FOR DELETE
  TO authenticated
  USING (is_committee(auth.uid()));

-- Grant DELETE permission explicitly
GRANT DELETE ON user_profiles TO authenticated;
GRANT DELETE ON devotee_records TO authenticated;
GRANT DELETE ON activity_logs TO authenticated;
