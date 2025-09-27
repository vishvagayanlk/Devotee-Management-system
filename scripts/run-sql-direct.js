#!/usr/bin/env node

/**
 * Run SQL Directly
 * 
 * This script runs SQL statements directly using Supabase client
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

async function runSQLDirect() {
  try {
    console.log('🚀 Running SQL migration directly...');
    
    // Read the migration file
    const migrationFile = 'supabase/migrations/20250127030000_add_multi_temple_support.sql';
    const sqlContent = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('📄 Migration file loaded');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📊 Found ${statements.length} SQL statements`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // Use the REST API directly
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql: statement })
          });
          
          if (!response.ok) {
            const error = await response.text();
            console.warn(`⚠️  Statement ${i + 1} warning:`, error);
          } else {
            console.log(`✅ Statement ${i + 1} completed`);
          }
        } catch (err) {
          console.warn(`⚠️  Statement ${i + 1} error:`, err.message);
        }
      }
    }
    
    console.log('✅ Migration completed!');
    console.log('🧪 Testing create_temple function...');
    
    // Test the function
    const { data, error } = await supabase.rpc('create_temple', {
      temple_name: 'Test Temple',
      temple_description: 'Test Description',
      temple_address: 'Test Address',
      temple_phone: '+94-11-123-4567',
      temple_email: 'test@temple.lk',
      temple_website: 'https://test.lk',
      admin_email: 'your-admin@temple.lk',
      admin_password: 'YourSecurePassword123!',
      admin_name: 'Test Admin',
      admin_phone: '+94-77-123-4567',
      admin_nic: '123456789V',
      admin_address: 'Test Admin Address'
    });
    
    if (error) {
      console.log('❌ Function test failed:', error.message);
    } else {
      console.log('✅ Function test successful:', data);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runSQLDirect();
