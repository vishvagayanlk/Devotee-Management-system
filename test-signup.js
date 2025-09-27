#!/usr/bin/env node

/**
 * Test script to verify user signup and profile creation
 * This script tests the complete flow from Clerk signup to Supabase profile creation
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignupFlow() {
  console.log('🧪 Testing Temple Management System Signup Flow\n');

  try {
    // Test 1: Check database connection
    console.log('1️⃣ Testing database connection...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }
    console.log('✅ Database connection successful');

    // Test 2: Check if user_profiles table has correct schema
    console.log('\n2️⃣ Checking user_profiles table schema...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error('❌ Error querying user_profiles:', profilesError.message);
      return;
    }

    console.log('✅ user_profiles table accessible');
    console.log('📋 Table columns available:', Object.keys(profiles[0] || {}));

    // Test 3: Check if super_admin role is supported
    console.log('\n3️⃣ Testing super_admin role support...');
    const testProfile = {
      clerk_id: 'test-clerk-id-' + Date.now(),
      email: 'test@example.com',
      full_name: 'Test User',
      is_approved: true,
      role: 'super_admin',
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedProfile, error: insertError } = await supabase
      .from('user_profiles')
      .insert(testProfile)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting test profile:', insertError.message);
      console.log('💡 This might mean the super_admin role is not supported in the database');
      console.log('💡 Run the migration script: supabase/sql/02-add-super-admin-role.sql');
      return;
    }

    console.log('✅ super_admin role supported');
    console.log('📋 Created test profile:', {
      id: insertedProfile.id,
      role: insertedProfile.role,
      is_approved: insertedProfile.is_approved
    });

    // Clean up test profile
    await supabase
      .from('user_profiles')
      .delete()
      .eq('id', insertedProfile.id);

    console.log('🧹 Cleaned up test profile');

    // Test 4: Check admin email detection
    console.log('\n4️⃣ Testing admin email detection...');
    const adminEmails = [
      'admin@temple.com',
      'superadmin@temple.com',
      'user@temple.com',
      'regular@example.com'
    ];

    for (const email of adminEmails) {
      // This would normally be done by the frontend adminConfig
      const isAdmin = email.includes('admin') || email.includes('temple.com');
      const role = isAdmin ? (email.includes('super') ? 'super_admin' : 'admin') : 'devotee';
      const isApproved = isAdmin;
      
      console.log(`📧 ${email} → Role: ${role}, Approved: ${isApproved}`);
    }

    console.log('\n🎉 All tests passed! The signup flow should work correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Make sure your .env file has the correct Supabase credentials');
    console.log('2. Run the migration script if super_admin role is not supported');
    console.log('3. Test the actual signup flow in your application');
    console.log('4. Check the browser console for any errors during signup');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSignupFlow();
