#!/usr/bin/env node

/**
 * Database Connection Test Script
 * This script tests the database connection and provides setup instructions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configure dotenv to load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.error('\nPlease check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('🏛️ Testing Temple Management System Database Connection...\n');

  try {
    // Test basic connection
    console.log('🔍 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      console.error('\nPossible solutions:');
      console.error('1. Check your Supabase URL and service key');
      console.error('2. Verify your Supabase project is active');
      console.error('3. Check if the user_profiles table exists');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');

    // Check if user_profiles table has data
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Error accessing user_profiles table:', profilesError.message);
      console.error('\nThe user_profiles table may not exist or have permission issues.');
    } else {
      console.log(`✅ user_profiles table accessible (${profilesData?.length || 0} records found)`);
    }

    // Check if clerk_id column exists
    const { data: clerkData, error: clerkError } = await supabase
      .from('user_profiles')
      .select('clerk_id')
      .limit(1);
    
    if (clerkError && clerkError.code === '42703') {
      console.log('⚠️  clerk_id column not found - database migrations needed');
    } else if (clerkError) {
      console.log('⚠️  Error checking clerk_id column:', clerkError.message);
    } else {
      console.log('✅ clerk_id column exists');
    }

    // Check if user_profile_details table exists
    const { data: detailsData, error: detailsError } = await supabase
      .from('user_profile_details')
      .select('*')
      .limit(1);
    
    if (detailsError && (detailsError.code === '42P01' || detailsError.code === 'PGRST116')) {
      console.log('⚠️  user_profile_details table not found - database migrations needed');
    } else if (detailsError) {
      console.log('⚠️  Error checking user_profile_details table:', detailsError.message);
    } else {
      console.log('✅ user_profile_details table exists');
    }

    console.log('\n📋 Next Steps:');
    console.log('1. If you see warnings above, run the database migrations:');
    console.log('   - Go to your Supabase Dashboard > SQL Editor');
    console.log('   - Copy and paste the contents of supabase/manual-migrations.sql');
    console.log('   - Execute the SQL statements');
    console.log('\n2. Test the profile loading again:');
    console.log('   - Start your dev server: npm run dev');
    console.log('   - Visit: http://localhost:5173/debug');
    console.log('   - Check the diagnostics for any remaining issues');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the test
testConnection();
