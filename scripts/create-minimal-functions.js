#!/usr/bin/env node

/**
 * Create Minimal Functions
 * 
 * This script creates just the essential functions needed for temple creation
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMinimalFunctions() {
  try {
    console.log('🚀 Creating minimal temple functions...');
    
    // First, let's create a simple temple creation function
    const createTempleSQL = `
    CREATE OR REPLACE FUNCTION create_temple(
      temple_name text,
      temple_description text DEFAULT NULL,
      temple_address text DEFAULT NULL,
      temple_phone text DEFAULT NULL,
      temple_email text DEFAULT NULL,
      temple_website text DEFAULT NULL,
      admin_email text,
      admin_password text,
      admin_name text,
      admin_phone text DEFAULT NULL,
      admin_nic text DEFAULT NULL,
      admin_address text DEFAULT NULL
    )
    RETURNS jsonb AS $$
    DECLARE
      new_temple_id uuid;
      new_admin_id uuid;
      result jsonb;
    BEGIN
      -- Validate inputs
      IF temple_name IS NULL OR temple_name = '' THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Temple name is required'
        );
      END IF;
      
      IF admin_email IS NULL OR admin_email = '' THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Admin email is required'
        );
      END IF;
      
      IF admin_password IS NULL OR length(admin_password) < 8 THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Admin password must be at least 8 characters long'
        );
      END IF;
      
      IF admin_name IS NULL OR admin_name = '' THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Admin name is required'
        );
      END IF;

      -- Check if admin email already exists
      IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Admin email already exists'
        );
      END IF;

      -- Create the temple
      INSERT INTO temple_settings (
        temple_name,
        temple_description,
        temple_address,
        temple_phone,
        temple_email,
        temple_website,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        temple_name,
        temple_description,
        temple_address,
        temple_phone,
        temple_email,
        temple_website,
        true,
        now(),
        now()
      ) RETURNING id INTO new_temple_id;

      -- Create the admin user using the existing function
      SELECT internal_functions.create_auth_user(admin_email, admin_password) INTO new_admin_id;
      
      -- Create admin profile
      INSERT INTO user_profiles (
        id,
        full_name,
        role,
        status,
        email,
        phone,
        nic_number,
        address,
        created_at,
        updated_at
      ) VALUES (
        new_admin_id,
        admin_name,
        'admin'::temple_user_role,
        'approved',
        admin_email,
        admin_phone,
        admin_nic,
        admin_address,
        now(),
        now()
      );

      -- Update temple_settings with created_by
      UPDATE temple_settings 
      SET created_by = new_admin_id 
      WHERE id = new_temple_id;

      RETURN jsonb_build_object(
        'success', true,
        'message', 'Temple and admin created successfully',
        'temple_id', new_temple_id,
        'temple_name', temple_name,
        'admin_id', new_admin_id,
        'admin_email', admin_email,
        'admin_name', admin_name
      );

    EXCEPTION
      WHEN OTHERS THEN
        -- Clean up if something fails
        IF new_temple_id IS NOT NULL THEN
          DELETE FROM temple_settings WHERE id = new_temple_id;
        END IF;
        IF new_admin_id IS NOT NULL THEN
          DELETE FROM auth.users WHERE id = new_admin_id;
        END IF;
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Failed to create temple: ' || SQLERRM
        );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    console.log('📄 SQL to run in Supabase Dashboard:');
    console.log('='.repeat(80));
    console.log(createTempleSQL);
    console.log('='.repeat(80));
    console.log('');
    console.log('📋 Instructions:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Click "Run" to execute');
    console.log('5. Then run: node scripts/csv-setup.js --temples=templates/temples.csv');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createMinimalFunctions();
