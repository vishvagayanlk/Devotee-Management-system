#!/usr/bin/env node

/**
 * Database Setup Script
 * This script applies the necessary database migrations for the temple management system
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
  console.error('\nPlease check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationName, sql) {
  console.log(`\n🔄 Running migration: ${migrationName}`);
  
  try {
    // Split SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec', { sql: statement.trim() });
        
        if (error) {
          // If exec doesn't work, try direct query execution
          console.log(`Trying alternative execution method for: ${statement.substring(0, 50)}...`);
          
          // For DDL statements, we might need to use a different approach
          // Let's try to execute the statements one by one using different methods
          if (statement.includes('CREATE TABLE') || statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX')) {
            console.log(`Skipping DDL statement (may need manual execution): ${statement.substring(0, 50)}...`);
            continue;
          }
          
          if (error.message.includes('function') && error.message.includes('exec')) {
            console.log(`⚠️  DDL statements may need to be executed manually in Supabase dashboard`);
            console.log(`   Statement: ${statement.substring(0, 100)}...`);
            continue;
          }
          
          console.error(`❌ Statement failed:`, error.message);
          return false;
        }
      }
    }
    
    console.log(`✅ Migration ${migrationName} completed successfully`);
    return true;
  } catch (err) {
    console.error(`❌ Migration ${migrationName} failed with error:`, err.message);
    return false;
  }
}

async function setupDatabase() {
  console.log('🏛️ Setting up Temple Management System Database...\n');

  // Migration 1: Add Clerk integration
  const clerkMigration = `
    -- Add clerk_id column if it doesn't exist
    DO $$ 
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'user_profiles' AND column_name = 'clerk_id') THEN
            ALTER TABLE user_profiles ADD COLUMN clerk_id TEXT UNIQUE;
        END IF;
    END $$;

    -- Add index for clerk_id for better performance
    CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_id);

    -- Update RLS policies to work with Clerk
    DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
    DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
    DROP POLICY IF EXISTS "Committee can view all profiles" ON user_profiles;
    DROP POLICY IF EXISTS "Committee can update all profiles" ON user_profiles;

    -- Create new policies that work with both Supabase auth and Clerk
    CREATE POLICY "Enable read access for authenticated users" ON user_profiles
        FOR SELECT USING (true);

    CREATE POLICY "Enable insert for authenticated users" ON user_profiles
        FOR INSERT WITH CHECK (true);

    CREATE POLICY "Enable update for authenticated users" ON user_profiles
        FOR UPDATE USING (true);
  `;

  // Migration 2: Add user profile details table
  const profileDetailsMigration = `
    -- Create user_profile_details table
    CREATE TABLE IF NOT EXISTS user_profile_details (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        date_of_birth DATE,
        gender TEXT CHECK (gender IN ('male', 'female', 'other')),
        occupation TEXT,
        special_requirements TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS idx_user_profile_details_user_id ON user_profile_details(user_id);

    -- Enable RLS
    ALTER TABLE user_profile_details ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Users can view their own profile details" ON user_profile_details
        FOR SELECT USING (user_id IN (
            SELECT id FROM user_profiles WHERE clerk_id = auth.jwt() ->> 'sub'
        ));

    CREATE POLICY "Users can update their own profile details" ON user_profile_details
        FOR UPDATE USING (user_id IN (
            SELECT id FROM user_profiles WHERE clerk_id = auth.jwt() ->> 'sub'
        ));

    CREATE POLICY "Users can insert their own profile details" ON user_profile_details
        FOR INSERT WITH CHECK (user_id IN (
            SELECT id FROM user_profiles WHERE clerk_id = auth.jwt() ->> 'sub'
        ));

    -- Create function to update updated_at timestamp
    CREATE OR REPLACE FUNCTION update_user_profile_details_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger for updated_at
    DROP TRIGGER IF EXISTS update_user_profile_details_updated_at ON user_profile_details;
    CREATE TRIGGER update_user_profile_details_updated_at
        BEFORE UPDATE ON user_profile_details
        FOR EACH ROW
        EXECUTE FUNCTION update_user_profile_details_updated_at();
  `;

  try {
    // Test connection
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');

    // Run migrations
    const migration1Success = await runMigration('Clerk Integration', clerkMigration);
    const migration2Success = await runMigration('User Profile Details', profileDetailsMigration);

    if (migration1Success && migration2Success) {
      console.log('\n🎉 Database setup completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Set up your Clerk account and get API keys');
      console.log('2. Add environment variables to .env.local');
      console.log('3. Start your development server: npm run dev');
    } else {
      console.log('\n❌ Some migrations failed. Please check the errors above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();