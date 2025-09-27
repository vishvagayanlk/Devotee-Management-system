/*
  # Quick Admin Setup Script
  
  This script:
  1. Removes the test admin account (admin@temple.lk)
  2. Creates a new production admin account
  
  Run this script in your Supabase SQL editor or via psql
*/

-- ==============================================
-- STEP 1: Remove Test Admin Account
-- ==============================================

-- Remove test admin account
SELECT remove_test_admins();

-- ==============================================
-- STEP 2: Create New Production Admin
-- ==============================================

-- Create new admin (replace with your details)
SELECT create_temple_admin(
  'admin@yourtemple.lk',                    -- Admin email
  'YourSecurePassword123!',                 -- Strong password
  'Temple Administrator',                   -- Full name
  '0771234567',                            -- Phone number
  '123456789V',                            -- NIC number
  '123 Temple Street, Colombo, Sri Lanka'  -- Address
);

-- ==============================================
-- STEP 3: Verify Admin Creation
-- ==============================================

-- List all admin users to verify
SELECT * FROM list_admin_users();

-- ==============================================
-- ALTERNATIVE: Create Multiple Admins
-- ==============================================

/*
-- Create additional admins if needed
SELECT create_temple_admin(
  'secretary@yourtemple.lk',
  'SecretaryPassword123!',
  'Temple Secretary',
  '0772345678',
  '234567890V',
  '456 Temple Avenue, Colombo, Sri Lanka'
);

SELECT create_temple_admin(
  'treasurer@yourtemple.lk',
  'TreasurerPassword123!',
  'Temple Treasurer',
  '0773456789',
  '345678901V',
  '789 Temple Road, Colombo, Sri Lanka'
);
*/
