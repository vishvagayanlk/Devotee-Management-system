/*
  # Add Test Admin User for Temple System

  1. Test Admin User
    - Creates a test admin user for system testing
    - Email: admin@temple.lk
    - Password: Admin123!
    - Full access to all temple management features

  2. Security
    - Test user has admin role and approved status
    - Can be used to test all administrative functions
    - Should be removed or password changed in production

  3. Usage
    - Use this account to test devotee management
    - Test event creation and management
    - Verify all administrative features work correctly
*/

-- Insert test admin user into auth.users (this would normally be done through Supabase Auth)
-- Note: In a real scenario, you would create this user through the Supabase dashboard or Auth API

-- Create the user in auth.users first
select internal_functions.create_auth_user('admin@temple.lk', 'Admin123!', '00000000-0000-0000-0000-000000000001');
select internal_functions.create_auth_user('saman.perera@email.com', 'Devotee123!', '00000000-0000-0000-0000-000000000002');

-- Create the user profile for the test admin
-- We'll use a UUID that represents our test admin
DO $$
DECLARE
  test_admin_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Insert or update the test admin profile
  INSERT INTO user_profiles (
    id,
    full_name,
    role,
    status,
    nic_number,
    address,
    phone,
    email,
    date_of_birth,
    occupation,
    emergency_contact,
    temple_join_date,
    bio,
    created_at,
    updated_at
  ) VALUES (
    test_admin_id,
    'Temple Administrator',
    'admin'::temple_user_role,
    'approved',
    '123456789V',
    'Temple Administrative Office, Main Street, Colombo 07',
    '+94771234567',
    'admin@temple.lk',
    '1980-01-01',
    'Temple Administrator',
    '+94771234568',
    '2020-01-01',
    'Head administrator of the temple devotee committee system. Responsible for managing all temple activities and devotee registrations.',
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    nic_number = EXCLUDED.nic_number,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    date_of_birth = EXCLUDED.date_of_birth,
    occupation = EXCLUDED.occupation,
    emergency_contact = EXCLUDED.emergency_contact,
    temple_join_date = EXCLUDED.temple_join_date,
    bio = EXCLUDED.bio,
    updated_at = now();

  -- Add some sample devotee records for the admin
  INSERT INTO devotee_records (
    user_id,
    record_type,
    title,
    content,
    amount,
    date_recorded
  ) VALUES 
  (
    test_admin_id,
    'note',
    'Temple System Setup',
    'Successfully set up the temple devotee management system. All features are working correctly.',
    NULL,
    CURRENT_DATE
  ),
  (
    test_admin_id,
    'donation',
    'Initial Temple Fund',
    'Initial donation to establish the temple management system.',
    50000.00,
    CURRENT_DATE - INTERVAL '7 days'
  ),
  (
    test_admin_id,
    'service',
    'System Administration',
    'Managing the temple devotee committee system and training committee members.',
    NULL,
    CURRENT_DATE - INTERVAL '3 days'
  ) ON CONFLICT DO NOTHING;

  -- Add some sample temple events
  INSERT INTO temple_events (
    user_id,
    event_type,
    title,
    description,
    location,
    start_date,
    end_date,
    all_day,
    max_participants,
    registration_required
  ) VALUES 
  (
    test_admin_id,
    'poya_day',
    'Full Moon Poya Day Observance',
    'Monthly Poya Day observance with special prayers and meditation sessions.',
    'Main Temple Hall',
    (CURRENT_DATE + INTERVAL '5 days')::timestamp + TIME '06:00:00',
    (CURRENT_DATE + INTERVAL '5 days')::timestamp + TIME '18:00:00',
    false,
    100,
    true
  ),
  (
    test_admin_id,
    'ceremony',
    'Buddha Purnima Celebration',
    'Annual celebration of Buddha Purnima with special ceremonies and community gathering.',
    'Temple Grounds',
    (CURRENT_DATE + INTERVAL '15 days')::timestamp + TIME '08:00:00',
    (CURRENT_DATE + INTERVAL '15 days')::timestamp + TIME '20:00:00',
    false,
    200,
    true
  ),
  (
    test_admin_id,
    'meeting',
    'Monthly Committee Meeting',
    'Regular monthly meeting of the temple committee to discuss ongoing activities and plans.',
    'Committee Room',
    (CURRENT_DATE + INTERVAL '10 days')::timestamp + TIME '19:00:00',
    (CURRENT_DATE + INTERVAL '10 days')::timestamp + TIME '21:00:00',
    false,
    15,
    false
  ) ON CONFLICT DO NOTHING;

  -- Log the admin user creation
  INSERT INTO activity_logs (
    user_id,
    admin_id,
    action,
    table_name,
    record_id,
    description
  ) VALUES (
    test_admin_id,
    NULL,
    'INSERT',
    'user_profiles',
    test_admin_id::text,
    'Test admin user created for system testing'
  ) ON CONFLICT DO NOTHING;

END $$;

-- Create a sample pending devotee for testing approval workflow
DO $$
DECLARE
  test_devotee_id uuid := '00000000-0000-0000-0000-000000000002';
BEGIN
  INSERT INTO user_profiles (
    id,
    full_name,
    role,
    status,
    nic_number,
    address,
    phone,
    email,
    date_of_birth,
    occupation,
    emergency_contact,
    temple_join_date,
    bio,
    created_at,
    updated_at
  ) VALUES (
    test_devotee_id,
    'Saman Perera',
    'devotee'::temple_user_role,
    'pending',
    '987654321V',
    '123 Temple Road, Kandy',
    '+94712345678',
    'saman.perera@email.com',
    '1985-05-15',
    'Teacher',
    '+94712345679',
    NULL,
    'New devotee seeking to join the temple community.',
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = now();
END $$;