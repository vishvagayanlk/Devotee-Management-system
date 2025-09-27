#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://unvdwqyfibedcvvrdyxj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema...');
  
  try {
    // Add is_active column to temple_settings table
    console.log('Adding is_active column to temple_settings...');
    const { error: templeSettingsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE temple_settings 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      `
    });
    
    if (templeSettingsError) {
      console.log('Note: temple_settings column might already exist:', templeSettingsError.message);
    }

    // Add is_active column to themes table
    console.log('Adding is_active column to themes...');
    const { error: themesError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE themes 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      `
    });
    
    if (themesError) {
      console.log('Note: themes column might already exist:', themesError.message);
    }

    // Update existing records to be active
    console.log('Updating existing records...');
    await supabase
      .from('temple_settings')
      .update({ is_active: true })
      .is('is_active', null);

    await supabase
      .from('themes')
      .update({ is_active: true })
      .is('is_active', null);

    console.log('✅ Database schema fixed successfully!');
    
    // Test the queries
    console.log('Testing temple_settings query...');
    const { data: templeData, error: templeError } = await supabase
      .from('temple_settings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (templeError) {
      console.error('❌ Temple settings query failed:', templeError);
    } else {
      console.log('✅ Temple settings query successful');
    }

    console.log('Testing themes query...');
    const { data: themesData, error: themesQueryError } = await supabase
      .from('themes')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (themesQueryError) {
      console.error('❌ Themes query failed:', themesQueryError);
    } else {
      console.log('✅ Themes query successful');
    }

  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
  }
}

fixDatabaseSchema();
