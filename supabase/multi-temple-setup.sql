-- ==============================================
-- MULTI-TEMPLE ADMIN SETUP SCRIPT
-- ==============================================
-- This script demonstrates how to set up multiple temples
-- with their own isolated admin users and devotees
-- ==============================================

-- ==============================================
-- STEP 1: CREATE TEMPLE 1 - MAIN TEMPLE
-- ==============================================

SELECT 'Creating Temple 1 - Main Temple...' as status;

SELECT create_temple(
  'Sri Maha Bodhi Temple',                    -- Temple name
  'A sacred temple dedicated to the sacred Bodhi tree', -- Description
  '123 Temple Road, Anuradhapura, Sri Lanka', -- Address
  '+94-25-222-2222',                         -- Phone
  'info@mahabodhitemple.lk',                 -- Email
  'https://mahabodhitemple.lk',              -- Website
  'admin@mahabodhitemple.lk',                -- Admin email
  'MainTempleAdmin123!',                     -- Admin password
  'Chief Administrator',                     -- Admin name
  '+94-77-123-4567',                        -- Admin phone
  '123456789V',                             -- Admin NIC
  '123 Temple Road, Anuradhapura'           -- Admin address
);

-- ==============================================
-- STEP 2: CREATE TEMPLE 2 - BRANCH TEMPLE
-- ==============================================

SELECT 'Creating Temple 2 - Branch Temple...' as status;

SELECT create_temple(
  'Temple of the Sacred Tooth',              -- Temple name
  'A historic temple housing the sacred tooth relic', -- Description
  '456 Sacred Street, Kandy, Sri Lanka',     -- Address
  '+94-81-222-3333',                         -- Phone
  'info@toothrelictemple.lk',                -- Email
  'https://toothrelictemple.lk',             -- Website
  'admin@toothrelictemple.lk',               -- Admin email
  'ToothTempleAdmin123!',                    -- Admin password
  'Temple Administrator',                    -- Admin name
  '+94-77-234-5678',                        -- Admin phone
  '234567890V',                             -- Admin NIC
  '456 Sacred Street, Kandy'                -- Admin address
);

-- ==============================================
-- STEP 3: CREATE TEMPLE 3 - VILLAGE TEMPLE
-- ==============================================

SELECT 'Creating Temple 3 - Village Temple...' as status;

SELECT create_temple(
  'Village Meditation Center',               -- Temple name
  'A peaceful meditation center for local community', -- Description
  '789 Peaceful Lane, Galle, Sri Lanka',     -- Address
  '+94-91-333-4444',                         -- Phone
  'info@villagecenter.lk',                   -- Email
  'https://villagecenter.lk',                -- Website
  'admin@villagecenter.lk',                  -- Admin email
  'VillageAdmin123!',                        -- Admin password
  'Village Administrator',                   -- Admin name
  '+94-77-345-6789',                        -- Admin phone
  '345678901V',                             -- Admin NIC
  '789 Peaceful Lane, Galle'                -- Admin address
);

-- ==============================================
-- STEP 4: ADD ADDITIONAL ADMINS TO EACH TEMPLE
-- ==============================================

-- Get temple IDs
WITH temple_ids AS (
  SELECT id, temple_name FROM temple_settings WHERE is_active = true
)
SELECT 'Adding additional admins...' as status;

-- Add secretary to Temple 1
SELECT create_temple_admin(
  (SELECT id FROM temple_settings WHERE temple_name = 'Sri Maha Bodhi Temple'),
  'secretary@mahabodhitemple.lk',
  'SecretaryPass123!',
  'Temple Secretary',
  '+94-77-111-2222',
  '111222333V',
  '123 Temple Road, Anuradhapura'
);

-- Add treasurer to Temple 1
SELECT create_temple_admin(
  (SELECT id FROM temple_settings WHERE temple_name = 'Sri Maha Bodhi Temple'),
  'treasurer@mahabodhitemple.lk',
  'TreasurerPass123!',
  'Temple Treasurer',
  '+94-77-111-3333',
  '111333444V',
  '123 Temple Road, Anuradhapura'
);

-- Add secretary to Temple 2
SELECT create_temple_admin(
  (SELECT id FROM temple_settings WHERE temple_name = 'Temple of the Sacred Tooth'),
  'secretary@toothrelictemple.lk',
  'SecretaryPass123!',
  'Temple Secretary',
  '+94-77-222-3333',
  '222333444V',
  '456 Sacred Street, Kandy'
);

-- Add secretary to Temple 3
SELECT create_temple_admin(
  (SELECT id FROM temple_settings WHERE temple_name = 'Village Meditation Center'),
  'secretary@villagecenter.lk',
  'SecretaryPass123!',
  'Temple Secretary',
  '+94-77-333-4444',
  '333444555V',
  '789 Peaceful Lane, Galle'
);

-- ==============================================
-- STEP 5: VERIFY TEMPLE SETUP
-- ==============================================

SELECT 'Verifying temple setup...' as status;

-- List all temples
SELECT 'All Temples:' as info;
SELECT * FROM list_all_temples();

-- List admins for each temple
SELECT 'Temple 1 Admins:' as info;
SELECT * FROM list_temple_admins(
  (SELECT id FROM temple_settings WHERE temple_name = 'Sri Maha Bodhi Temple')
);

SELECT 'Temple 2 Admins:' as info;
SELECT * FROM list_temple_admins(
  (SELECT id FROM temple_settings WHERE temple_name = 'Temple of the Sacred Tooth')
);

SELECT 'Temple 3 Admins:' as info;
SELECT * FROM list_temple_admins(
  (SELECT id FROM temple_settings WHERE temple_name = 'Village Meditation Center')
);

-- ==============================================
-- STEP 6: SUCCESS MESSAGE
-- ==============================================

SELECT 'Multi-temple setup completed successfully!' as status;
SELECT 'Each temple now has its own isolated admin users and data.' as info;
SELECT 'Admins can only access their own temple data.' as security_note;
