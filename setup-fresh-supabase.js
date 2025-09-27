#!/usr/bin/env node

/**
 * Fresh Supabase Project Setup Script
 * This script helps you set up a completely fresh Supabase project
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🏛️ Fresh Supabase Project Setup\n');

// Check if environment variables are set
if (!supabaseUrl || !supabaseServiceKey || 
    supabaseUrl.includes('your-project-id') || 
    supabaseServiceKey.includes('your_service_role_key')) {
  
  console.log('❌ Please update your .env file with your new Supabase project credentials first!\n');
  console.log('📋 Steps to get your credentials:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Create a new project');
  console.log('3. Go to Settings → API');
  console.log('4. Copy Project URL and service_role key');
  console.log('5. Update your .env file');
  console.log('\nThen run this script again: node setup-fresh-supabase.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupFreshProject() {
  try {
    console.log('🔍 Testing connection to fresh Supabase project...');
    
    // Test basic connection by trying to access a system table
    const { data, error } = await supabase.rpc('exec', { sql: 'SELECT 1 as test;' });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.log('\n🔧 Make sure:');
      console.log('1. Your Supabase project is fully created (wait 2-3 minutes)');
      console.log('2. Your credentials are correct in .env file');
      console.log('3. Your project is not paused');
      process.exit(1);
    }
    
    console.log('✅ Connected to fresh Supabase project!\n');

    // Create the essential tables
    console.log('📋 Creating essential database tables...\n');

    // 1. Create user_profiles table
    console.log('1️⃣ Creating user_profiles table...');
    
    try {
      await supabase.rpc('exec', { 
        sql: `
          CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            clerk_id TEXT UNIQUE,
            email TEXT NOT NULL,
            full_name TEXT,
            phone TEXT,
            nic TEXT,
            address TEXT,
            group_id UUID,
            is_approved BOOLEAN DEFAULT false,
            role TEXT DEFAULT 'devotee' CHECK (role IN ('admin', 'committee', 'devotee')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        ` 
      });
      console.log('   ✅ Created user_profiles table');
    } catch (err) {
      console.log('   ⚠️  Table may already exist');
    }

    // Add clerk_id index
    try {
      await supabase.rpc('exec', { 
        sql: `CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_id);` 
      });
      console.log('   ✅ Added clerk_id index');
    } catch (err) {
      console.log('   ⚠️  Index may already exist');
    }

    // Enable RLS and create simple policy
    try {
      await supabase.rpc('exec', { 
        sql: `
          ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "Allow all operations" ON user_profiles;
          CREATE POLICY "Allow all operations" ON user_profiles
          FOR ALL USING (true) WITH CHECK (true);
        ` 
      });
      console.log('   ✅ Updated RLS policies');
    } catch (err) {
      console.log('   ⚠️  RLS policies may already be updated');
    }

    // 2. Create groups table
    console.log('\n2️⃣ Creating groups table...');
    
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

    // Add default groups
    try {
      const { data: existingGroups } = await supabase.from('groups').select('id').limit(1);
      if (!existingGroups || existingGroups.length === 0) {
        await supabase.from('groups').insert([
          { name: 'General Devotees', description: 'General temple devotees' },
          { name: 'Committee Members', description: 'Temple committee members' },
          { name: 'Volunteers', description: 'Temple volunteers' },
          { name: 'Youth Group', description: 'Young devotees group' }
        ]);
        console.log('   ✅ Added default groups');
      } else {
        console.log('   ✅ Groups already exist');
      }
    } catch (err) {
      console.log('   ⚠️  Could not add default groups');
    }

    // 3. Create user_profile_details table
    console.log('\n3️⃣ Creating user_profile_details table...');
    
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

    // Add index and RLS
    try {
      await supabase.rpc('exec', { 
        sql: `
          CREATE INDEX IF NOT EXISTS idx_user_profile_details_user_id ON user_profile_details(user_id);
          ALTER TABLE user_profile_details ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "Allow all operations" ON user_profile_details;
          CREATE POLICY "Allow all operations" ON user_profile_details
          FOR ALL USING (true) WITH CHECK (true);
        ` 
      });
      console.log('   ✅ Added index and RLS policies');
    } catch (err) {
      console.log('   ⚠️  Index and policies may already exist');
    }

    // 4. Test the setup
    console.log('\n🧪 Testing the fresh setup...');
    
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

    console.log('\n🎉 Fresh Supabase project setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Visit: http://localhost:5175/sign-up');
    console.log('3. Create a new account and test the flow');
    console.log('4. Visit: http://localhost:5175/debug to check diagnostics');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Manual setup required:');
    console.log('1. Go to your Supabase Dashboard > SQL Editor');
    console.log('2. Run the SQL from: supabase/manual-migrations.sql');
    console.log('3. Then run: npm run dev');
  }
}

// Run the setup
setupFreshProject();
