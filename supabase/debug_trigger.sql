-- Debug script for the create_temple_profile trigger issue
-- Run this in your Supabase SQL Editor to diagnose the problem

-- 1. Check if the trigger function exists
SELECT 
    routine_name, 
    routine_type, 
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'create_temple_profile';

-- 2. Check if the trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 3. Check RLS policies on user_profiles table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 4. Test the trigger function manually (replace with actual values)
-- This simulates what happens when a user is created
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    test_metadata jsonb := '{
        "full_name": "Test User",
        "nic_number": "123456789V",
        "address": "Test Address",
        "phone": "0771234567",
        "email": "test@example.com"
    }';
BEGIN
    -- Insert a test user into auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        test_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'test@example.com',
        crypt('testpassword', gen_salt('bf')),
        now(),
        test_metadata,
        now(),
        now()
    );
    
    -- Check if the profile was created
    IF EXISTS (SELECT 1 FROM user_profiles WHERE id = test_user_id) THEN
        RAISE NOTICE 'SUCCESS: Profile was created by trigger';
    ELSE
        RAISE NOTICE 'ERROR: Profile was NOT created by trigger';
    END IF;
    
    -- Clean up
    DELETE FROM auth.users WHERE id = test_user_id;
    DELETE FROM user_profiles WHERE id = test_user_id;
END $$;

-- 5. Check if there are any constraints or issues with the user_profiles table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 6. Check for any foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'user_profiles';

