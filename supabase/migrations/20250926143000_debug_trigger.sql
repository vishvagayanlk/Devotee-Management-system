/*
  # Debug and fix the user profile creation trigger
  
  This migration checks if the trigger is working and fixes any issues
*/

-- First, let's check if the trigger exists and is working
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if the function exists
SELECT 
    routine_name, 
    routine_type, 
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'create_temple_profile';

-- Let's also check if there are any existing profiles
SELECT COUNT(*) as profile_count FROM user_profiles;

-- Check if there are any users in auth.users without profiles
SELECT 
    au.id,
    au.email,
    au.created_at,
    up.id as profile_id
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
LIMIT 5;

-- If there are users without profiles, let's create them
INSERT INTO user_profiles (id, full_name, role, status, email)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', 'New Devotee'),
    CASE 
        WHEN (SELECT COUNT(*) FROM user_profiles WHERE role::text = 'admin') = 0 THEN 'admin'::temple_user_role
        ELSE 'devotee'::temple_user_role
    END,
    CASE 
        WHEN (SELECT COUNT(*) FROM user_profiles WHERE role::text = 'admin') = 0 THEN 'approved'::user_status
        ELSE 'pending'::user_status
    END,
    au.email
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Now let's make sure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger with better error handling
CREATE OR REPLACE FUNCTION create_temple_profile()
RETURNS trigger AS $$
DECLARE
  user_full_name text;
  user_nic_number text;
  user_address text;
  user_phone text;
  user_email text;
  profile_count integer;
BEGIN
  -- Get the count of existing admin profiles
  SELECT COUNT(*) INTO profile_count FROM user_profiles WHERE role::text = 'admin';
  
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
  IF profile_count = 0 THEN
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
