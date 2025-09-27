/*
  # Temple Admin Management Script
  
  This script provides functions to:
  1. Create new admin users
  2. Remove test admin accounts
  3. List all admin users
  4. Promote existing users to admin
  5. Demote admin users to regular devotees
  
  Usage:
  - Run individual functions as needed
  - Use the cleanup function to remove test accounts
  - Use create_admin to add new administrators
*/

-- ==============================================
-- 1. CREATE NEW ADMIN USER
-- ==============================================

CREATE OR REPLACE FUNCTION create_temple_admin(
  admin_email text,
  admin_password text,
  admin_name text,
  admin_phone text DEFAULT NULL,
  admin_nic text DEFAULT NULL,
  admin_address text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  new_user_id uuid;
  result jsonb;
BEGIN
  -- Validate inputs
  IF admin_email IS NULL OR admin_email = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email is required'
    );
  END IF;
  
  IF admin_password IS NULL OR length(admin_password) < 8 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Password must be at least 8 characters long'
    );
  END IF;
  
  IF admin_name IS NULL OR admin_name = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Admin name is required'
    );
  END IF;

  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User with this email already exists'
    );
  END IF;

  -- Create the auth user
  SELECT internal_functions.create_auth_user(admin_email, admin_password) INTO new_user_id;
  
  -- Create admin profile
  INSERT INTO user_profiles (
    id,
    full_name,
    role,
    status,
    email,
    phone,
    nic_number,
    address,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    admin_name,
    'admin'::temple_user_role,
    'approved',
    admin_email,
    admin_phone,
    admin_nic,
    admin_address,
    now(),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin user created successfully',
    'user_id', new_user_id,
    'email', admin_email,
    'name', admin_name
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Clean up auth user if profile creation fails
    DELETE FROM auth.users WHERE id = new_user_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to create admin user: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 2. PROMOTE EXISTING USER TO ADMIN
-- ==============================================

CREATE OR REPLACE FUNCTION promote_to_admin(
  user_email text
)
RETURNS jsonb AS $$
DECLARE
  target_user_id uuid;
  user_profile record;
BEGIN
  -- Find the user
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found with email: ' || user_email
    );
  END IF;

  -- Get current profile
  SELECT * INTO user_profile FROM user_profiles WHERE id = target_user_id;
  
  IF user_profile IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User profile not found'
    );
  END IF;

  -- Update role to admin
  UPDATE user_profiles 
  SET 
    role = 'admin'::temple_user_role,
    status = 'approved',
    updated_at = now()
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User promoted to admin successfully',
    'user_id', target_user_id,
    'email', user_email,
    'name', user_profile.full_name
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to promote user: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 3. DEMOTE ADMIN TO DEVOTEE
-- ==============================================

CREATE OR REPLACE FUNCTION demote_admin(
  user_email text
)
RETURNS jsonb AS $$
DECLARE
  target_user_id uuid;
  user_profile record;
  admin_count integer;
BEGIN
  -- Find the user
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found with email: ' || user_email
    );
  END IF;

  -- Get current profile
  SELECT * INTO user_profile FROM user_profiles WHERE id = target_user_id;
  
  IF user_profile IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User profile not found'
    );
  END IF;

  -- Check if user is actually an admin
  IF user_profile.role != 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is not an admin'
    );
  END IF;

  -- Count remaining admins
  SELECT COUNT(*) INTO admin_count 
  FROM user_profiles 
  WHERE role = 'admin' AND id != target_user_id;

  -- Prevent demoting the last admin
  IF admin_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot demote the last admin user'
    );
  END IF;

  -- Update role to devotee
  UPDATE user_profiles 
  SET 
    role = 'devotee'::temple_user_role,
    status = 'pending',
    updated_at = now()
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin demoted to devotee successfully',
    'user_id', target_user_id,
    'email', user_email,
    'name', user_profile.full_name
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to demote admin: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 4. LIST ALL ADMIN USERS
-- ==============================================

CREATE OR REPLACE FUNCTION list_admin_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  phone text,
  nic_number text,
  address text,
  created_at timestamptz,
  last_sign_in_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name,
    up.phone,
    up.nic_number,
    up.address,
    up.created_at,
    au.last_sign_in_at
  FROM user_profiles up
  JOIN auth.users au ON up.id = au.id
  WHERE up.role = 'admin'
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 5. REMOVE TEST ADMIN ACCOUNTS
-- ==============================================

CREATE OR REPLACE FUNCTION remove_test_admins()
RETURNS jsonb AS $$
DECLARE
  test_emails text[] := ARRAY['admin@temple.lk', 'test@temple.lk', 'testadmin@temple.lk'];
  email_to_remove text;
  removed_count integer := 0;
  result jsonb;
BEGIN
  -- Loop through test emails and remove them
  FOREACH email_to_remove IN ARRAY test_emails
  LOOP
    -- Check if user exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = email_to_remove) THEN
      -- Get user ID
      DECLARE
        user_id_to_remove uuid;
      BEGIN
        SELECT id INTO user_id_to_remove FROM auth.users WHERE email = email_to_remove;
        
        -- Delete from user_profiles first (due to foreign key constraints)
        DELETE FROM user_profiles WHERE id = user_id_to_remove;
        
        -- Delete from auth.identities
        DELETE FROM auth.identities WHERE user_id = user_id_to_remove;
        
        -- Delete from auth.users
        DELETE FROM auth.users WHERE id = user_id_to_remove;
        
        removed_count := removed_count + 1;
      END;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Test admin cleanup completed',
    'removed_count', removed_count,
    'test_emails_checked', test_emails
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to remove test admins: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 6. DELETE SPECIFIC ADMIN BY EMAIL
-- ==============================================

CREATE OR REPLACE FUNCTION delete_admin_by_email(
  admin_email text
)
RETURNS jsonb AS $$
DECLARE
  target_user_id uuid;
  admin_count integer;
  user_profile record;
BEGIN
  -- Find the user
  SELECT id INTO target_user_id FROM auth.users WHERE email = admin_email;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found with email: ' || admin_email
    );
  END IF;

  -- Get current profile
  SELECT * INTO user_profile FROM user_profiles WHERE id = target_user_id;
  
  -- Check if user is actually an admin
  IF user_profile.role != 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is not an admin'
    );
  END IF;

  -- Count remaining admins
  SELECT COUNT(*) INTO admin_count 
  FROM user_profiles 
  WHERE role = 'admin' AND id != target_user_id;

  -- Prevent deleting the last admin
  IF admin_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot delete the last admin user'
    );
  END IF;

  -- Delete from user_profiles first
  DELETE FROM user_profiles WHERE id = target_user_id;
  
  -- Delete from auth.identities
  DELETE FROM auth.identities WHERE user_id = target_user_id;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin deleted successfully',
    'deleted_email', admin_email,
    'deleted_name', user_profile.full_name
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to delete admin: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 7. ADMIN MANAGEMENT UTILITIES
-- ==============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_temple_admin TO authenticated;
GRANT EXECUTE ON FUNCTION promote_to_admin TO authenticated;
GRANT EXECUTE ON FUNCTION demote_admin TO authenticated;
GRANT EXECUTE ON FUNCTION list_admin_users TO authenticated;
GRANT EXECUTE ON FUNCTION remove_test_admins TO authenticated;
GRANT EXECUTE ON FUNCTION delete_admin_by_email TO authenticated;

-- ==============================================
-- 8. USAGE EXAMPLES
-- ==============================================

/*
-- Create a new admin
SELECT create_temple_admin(
  'newadmin@temple.lk',
  'SecurePassword123!',
  'New Temple Administrator',
  '0771234567',
  '123456789V',
  '123 Temple Street, Colombo'
);

-- Promote existing user to admin
SELECT promote_to_admin('existinguser@email.com');

-- List all admins
SELECT * FROM list_admin_users();

-- Remove test admin accounts
SELECT remove_test_admins();

-- Delete specific admin
SELECT delete_admin_by_email('admin@temple.lk');

-- Demote admin to devotee
SELECT demote_admin('admin@temple.lk');
*/
