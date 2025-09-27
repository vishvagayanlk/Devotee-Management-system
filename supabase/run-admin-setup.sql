-- ==============================================
-- TEMPLE ADMIN SETUP SCRIPT
-- ==============================================
-- Run this script in Supabase SQL Editor to:
-- 1. Remove test admin account (admin@temple.lk)
-- 2. Create a new production admin account
-- ==============================================

-- Step 1: Remove test admin account
SELECT 'Removing test admin account...' as status;
SELECT remove_test_admins();

-- Step 2: Create new production admin
-- ⚠️  IMPORTANT: Replace these details with your actual admin information
SELECT 'Creating new production admin...' as status;
SELECT create_temple_admin(
  'admin@yourtemple.lk',                    -- ⚠️  CHANGE THIS EMAIL
  'YourSecurePassword123!',                 -- ⚠️  CHANGE THIS PASSWORD
  'Temple Administrator',                   -- ⚠️  CHANGE THIS NAME
  '0771234567',                            -- ⚠️  CHANGE THIS PHONE
  '123456789V',                            -- ⚠️  CHANGE THIS NIC
  '123 Temple Street, Colombo, Sri Lanka'  -- ⚠️  CHANGE THIS ADDRESS
);

-- Step 3: Verify admin creation
SELECT 'Verifying admin creation...' as status;
SELECT * FROM list_admin_users();

-- Step 4: Success message
SELECT 'Admin setup completed successfully!' as status;
SELECT 'You can now log in with your new admin credentials.' as next_step;
