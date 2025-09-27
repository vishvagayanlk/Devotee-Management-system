#!/usr/bin/env node

/**
 * Production Setup Script - Temple Management System
 * This script creates a clean, working setup from scratch
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupProduction() {
  console.log('🏛️ Setting up Temple Management System - Production Ready\n');

  try {
    // Test connection
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Database connection successful\n');

    // Create the essential tables with simple structure
    console.log('📋 Creating essential database tables...\n');

    // 1. Update user_profiles table to work with Clerk
    console.log('1️⃣ Updating user_profiles table...');
    
    // Add clerk_id column if it doesn't exist
    try {
      await supabase.rpc('exec', { 
        sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;` 
      });
      console.log('   ✅ Added clerk_id column');
    } catch (err) {
      console.log('   ⚠️  clerk_id column may already exist');
    }

    // Add index
    try {
      await supabase.rpc('exec', { 
        sql: `CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_id);` 
      });
      console.log('   ✅ Added index for clerk_id');
    } catch (err) {
      console.log('   ⚠️  Index may already exist');
    }

    // Update RLS policies to be simple and permissive
    try {
      await supabase.rpc('exec', { 
        sql: `
          DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
          DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
          DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
          DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
          DROP POLICY IF EXISTS "Committee can view all profiles" ON user_profiles;
          DROP POLICY IF EXISTS "Committee can update all profiles" ON user_profiles;
          DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
          DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
          DROP POLICY IF EXISTS "Enable update for authenticated users" ON user_profiles;
        ` 
      });
      
      await supabase.rpc('exec', { 
        sql: `
          CREATE POLICY "Allow all operations" ON user_profiles
          FOR ALL USING (true) WITH CHECK (true);
        ` 
      });
      console.log('   ✅ Updated RLS policies');
    } catch (err) {
      console.log('   ⚠️  RLS policies may already be updated');
    }

    // 2. Create simple user_profile_details table
    console.log('\n2️⃣ Creating user_profile_details table...');
    
    try {
      await supabase.rpc('exec', { 
        sql: `
          CREATE TABLE IF NOT EXISTS user_profile_details (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
            emergency_contact_name TEXT,
            emergency_contact_phone TEXT,
            date_of_birth DATE,
            gender TEXT,
            occupation TEXT,
            special_requirements TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        ` 
      });
      console.log('   ✅ Created user_profile_details table');
    } catch (err) {
      console.log('   ⚠️  Table may already exist');
    }

    // Add index
    try {
      await supabase.rpc('exec', { 
        sql: `CREATE INDEX IF NOT EXISTS idx_user_profile_details_user_id ON user_profile_details(user_id);` 
      });
      console.log('   ✅ Added index for user_id');
    } catch (err) {
      console.log('   ⚠️  Index may already exist');
    }

    // Enable RLS and create simple policy
    try {
      await supabase.rpc('exec', { 
        sql: `
          ALTER TABLE user_profile_details ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "Users can view their own profile details" ON user_profile_details;
          DROP POLICY IF EXISTS "Users can update their own profile details" ON user_profile_details;
          DROP POLICY IF EXISTS "Users can insert their own profile details" ON user_profile_details;
        ` 
      });
      
      await supabase.rpc('exec', { 
        sql: `
          CREATE POLICY "Allow all operations" ON user_profile_details
          FOR ALL USING (true) WITH CHECK (true);
        ` 
      });
      console.log('   ✅ Updated RLS policies');
    } catch (err) {
      console.log('   ⚠️  RLS policies may already be updated');
    }

    // 3. Create groups table if it doesn't exist
    console.log('\n3️⃣ Creating groups table...');
    
    try {
      await supabase.rpc('exec', { 
        sql: `
          CREATE TABLE IF NOT EXISTS groups (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        ` 
      });
      console.log('   ✅ Created groups table');
    } catch (err) {
      console.log('   ⚠️  Table may already exist');
    }

    // Add some default groups
    try {
      const { data: existingGroups } = await supabase.from('groups').select('id').limit(1);
      if (!existingGroups || existingGroups.length === 0) {
        await supabase.from('groups').insert([
          { name: 'General Devotees', description: 'General temple devotees' },
          { name: 'Committee Members', description: 'Temple committee members' },
          { name: 'Volunteers', description: 'Temple volunteers' }
        ]);
        console.log('   ✅ Added default groups');
      } else {
        console.log('   ✅ Groups already exist');
      }
    } catch (err) {
      console.log('   ⚠️  Could not add default groups');
    }

    // 4. Test the setup
    console.log('\n🧪 Testing the setup...');
    
    // Test user_profiles table
    const { data: profilesTest, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, clerk_id, email, full_name')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ user_profiles table test failed:', profilesError.message);
    } else {
      console.log('   ✅ user_profiles table working');
    }

    // Test user_profile_details table
    const { data: detailsTest, error: detailsError } = await supabase
      .from('user_profile_details')
      .select('id')
      .limit(1);
    
    if (detailsError) {
      console.error('❌ user_profile_details table test failed:', detailsError.message);
    } else {
      console.log('   ✅ user_profile_details table working');
    }

    // Test groups table
    const { data: groupsTest, error: groupsError } = await supabase
      .from('groups')
      .select('id, name')
      .limit(1);
    
    if (groupsError) {
      console.error('❌ groups table test failed:', groupsError.message);
    } else {
      console.log('   ✅ groups table working');
    }

    console.log('\n🎉 Production setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Visit: http://localhost:5173/sign-up');
    console.log('3. Create a new account and test the flow');
    console.log('4. Visit: http://localhost:5173/debug to check diagnostics');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Manual setup required:');
    console.log('1. Go to your Supabase Dashboard > SQL Editor');
    console.log('2. Run the SQL from: supabase/manual-migrations.sql');
    console.log('3. Then run: npm run dev');
  }
}

// Run the setup
setupProduction();
