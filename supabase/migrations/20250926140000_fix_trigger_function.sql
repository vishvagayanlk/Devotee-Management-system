/*
  # Fix create_temple_profile trigger function
  
  The trigger function was failing because it was trying to access metadata fields
  that might be null or undefined. This migration fixes the function to handle
  null values gracefully and provides proper defaults.
*/

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a more robust version of the create_temple_profile function
CREATE OR REPLACE FUNCTION create_temple_profile()
RETURNS trigger AS $$
DECLARE
  user_full_name text;
  user_nic_number text;
  user_address text;
  user_phone text;
  user_email text;
BEGIN
  -- Safely extract metadata with proper null handling
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name', 
    'New Devotee'
  );
  
  user_nic_number := COALESCE(
    NEW.raw_user_meta_data->>'nic_number', 
    NULL
  );
  
  user_address := COALESCE(
    NEW.raw_user_meta_data->>'address', 
    NULL
  );
  
  user_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone', 
    NULL
  );
  
  user_email := COALESCE(
    NEW.raw_user_meta_data->>'email', 
    NEW.email
  );

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
      user_nic_number,
      user_address,
      user_phone,
      user_email
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
      user_full_name, 
      'devotee'::temple_user_role, 
      'pending',
      user_nic_number,
      user_address,
      user_phone,
      user_email
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating temple profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_temple_profile();
