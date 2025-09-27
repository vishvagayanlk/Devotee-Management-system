#!/usr/bin/env node

/**
 * Apply Database Migration
 * 
 * This script applies the multi-temple migration using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

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

async function applyMigration() {
  try {
    console.log('🚀 Applying multi-temple migration...');
    
    // Read the migration file
    const migrationFile = 'supabase/migrations/20250127030000_add_multi_temple_support.sql';
    const sqlContent = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('⚠️  This migration needs to be run in the Supabase SQL Editor');
    console.log('');
    console.log('📋 Please follow these steps:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the following SQL:');
    console.log('');
    console.log('='.repeat(80));
    console.log(sqlContent);
    console.log('='.repeat(80));
    console.log('');
    console.log('4. Click "Run" to execute the migration');
    console.log('5. Then run: node scripts/csv-setup.js --temples=templates/temples.csv');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
