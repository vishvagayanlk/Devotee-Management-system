#!/usr/bin/env node

/**
 * Test Setup Script
 * This script tests if your database setup is working correctly
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

console.log('🧪 Testing Temple Management System Setup\n');

// Check if environment variables are set
if (!supabaseUrl || !supabaseServiceKey || 
    supabaseUrl.includes('your-project-id') || 
    supabaseServiceKey.includes('your_service_role_key')) {
  
  console.log('❌ Please update your .env file with your Supabase credentials first!\n');
  console.log('📋 Steps:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Create a new project');
  console.log('3. Go to Settings → API');
  console.log('4. Copy Project URL and service_role key');
  console.log('5. Update your .env file');
  console.log('\nThen run this script again: node test-setup.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSetup() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.log('\n🔧 Make sure:');
      console.log('1. Your Supabase project is fully created');
      console.log('2. You have run the SQL setup in Supabase Dashboard');
      console.log('3. Your credentials are correct');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful\n');

    // Test all tables
    const tables = [
      { name: 'user_profiles', description: 'Main user profiles table' },
      { name: 'groups', description: 'Temple groups' },
      { name: 'user_profile_details', description: 'Additional profile details' },
      { name: 'events', description: 'Temple events' },
      { name: 'records', description: 'Devotee records' },
      { name: 'temple_settings', description: 'Temple settings' }
    ];

    console.log('📋 Testing database tables...\n');

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table.name).select('*').limit(1);
        
        if (error) {
          console.log(`❌ ${table.name} - ${error.message}`);
        } else {
          console.log(`✅ ${table.name} - ${table.description}`);
        }
      } catch (err) {
        console.log(`❌ ${table.name} - ${err.message}`);
      }
    }

    // Test groups data
    console.log('\n🔍 Checking default data...');
    
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('name, description')
      .limit(5);
    
    if (groupsError) {
      console.log('❌ Could not fetch groups data');
    } else {
      console.log('✅ Default groups found:');
      groups.forEach(group => {
        console.log(`   - ${group.name}: ${group.description}`);
      });
    }

    // Test temple settings
    const { data: settings, error: settingsError } = await supabase
      .from('temple_settings')
      .select('temple_name')
      .limit(1);
    
    if (settingsError) {
      console.log('❌ Could not fetch temple settings');
    } else {
      console.log(`✅ Temple settings found: ${settings[0]?.temple_name || 'Default'}`);
    }

    console.log('\n🎉 Setup test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Visit: http://localhost:5175/sign-up');
    console.log('3. Create a new account and test the flow');
    console.log('4. Visit: http://localhost:5175/debug to check diagnostics');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Make sure you have:');
    console.log('1. Created a fresh Supabase project');
    console.log('2. Updated your .env file with correct credentials');
    console.log('3. Run the SQL setup in Supabase Dashboard');
  }
}

// Run the test
testSetup();
