/*
  # Update Trigger Function for Groups
  
  This migration updates the create_temple_profile trigger function to handle group_id from user metadata.
*/

-- Update the trigger function to include group_id
CREATE OR REPLACE FUNCTION create_temple_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles with group_id from metadata
  INSERT INTO user_profiles (
    id,
    full_name,
    role,
    status,
    nic_number,
    address,
    phone,
    email,
    group_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Devotee'),
    'devotee',
    'pending',
    COALESCE(NEW.raw_user_meta_data->>'nic_number', NULL),
    COALESCE(NEW.raw_user_meta_data->>'address', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'email', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'group_id', NULL)::uuid,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating temple profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
