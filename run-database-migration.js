#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * This script helps you run the database migration to fix the user_profiles table schema.
 * It will guide you through the process of applying the migration to your Supabase database.
 */

const fs = require('fs');
const path = require('path');

console.log('🗄️  Database Migration Runner');
console.log('================================\n');

console.log('This script will help you fix the user_profiles table schema issue.');
console.log('The error you\'re seeing is because the database is missing required columns.\n');

console.log('📋 What this migration will do:');
console.log('• Add clerk_id column for Clerk authentication');
console.log('• Add is_approved column for user approval status');
console.log('• Add first_name, last_name, phone_number columns');
console.log('• Update existing data to populate new columns');
console.log('• Add proper indexes for performance');
console.log('• Update RLS policies for Clerk authentication\n');

console.log('🚀 Steps to run the migration:');
console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to SQL Editor in the left sidebar');
console.log('4. Click "New Query"');
console.log('5. Copy and paste the SQL from: fix-user-profiles-complete.sql');
console.log('6. Click "Run" to execute the migration\n');

console.log('📄 Migration file location:');
console.log(path.resolve(__dirname, 'fix-user-profiles-complete.sql'));

console.log('\n✅ After running the migration:');
console.log('• User profile creation will work');
console.log('• Admin approval/rejection will work');
console.log('• No more "is_approved column not found" errors');
console.log('• Clerk authentication will work properly\n');

console.log('🔍 To verify the migration worked:');
console.log('1. Check the SQL Editor output for success messages');
console.log('2. Go to Table Editor and verify the user_profiles table has the new columns');
console.log('3. Test user registration in your app\n');

console.log('Need help? Check the migration file for detailed SQL commands.');
console.log('The migration is safe to run multiple times (uses IF NOT EXISTS).\n');
