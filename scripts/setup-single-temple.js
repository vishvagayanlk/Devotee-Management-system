#!/usr/bin/env node

/**
 * Single Temple Setup Script
 * 
 * This script sets up a single temple with admin users.
 * 
 * Usage:
 *   node scripts/setup-single-temple.js --admin-email=your-admin@temple.lk --admin-password=YourSecurePassword123! --admin-name="Temple Admin"
 *   node scripts/setup-single-temple.js --help
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

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      options[key] = value;
    }
  }
  
  return options;
}

// Show help
function showHelp() {
  console.log(`
🏛️  Single Temple Setup Script
================================

Usage:
  node scripts/setup-single-temple.js [options]

Options:
  --admin-email=EMAIL     Admin email address (required)
  --admin-password=PASS   Admin password (required)
  --admin-name=NAME       Admin full name (required)
  --admin-phone=PHONE     Admin phone number (optional)
  --admin-nic=NIC         Admin NIC number (optional)
  --admin-address=ADDR    Admin address (optional)
  --temple-name=NAME      Temple name (default: "Temple Management System")
  --temple-description=DESC  Temple description (optional)
  --temple-address=ADDR   Temple address (optional)
  --temple-phone=PHONE    Temple phone (optional)
  --temple-email=EMAIL    Temple email (optional)
  --temple-website=URL    Temple website (optional)
  --help, -h              Show this help message

Example:
  node scripts/setup-single-temple.js \\
    --admin-email=your-admin@temple.lk \\
    --admin-password=YourSecurePassword123! \\
    --admin-name="Temple Administrator" \\
    --temple-name="Sri Lanka Temple" \\
    --temple-description="A beautiful temple for community worship"
`);
}

// Function to create single temple setup
async function setupSingleTemple(options) {
  try {
    console.log('🏛️  Setting up single temple...');
    
    // Validate required options
    if (!options['admin-email'] || !options['admin-password'] || !options['admin-name']) {
      console.error('❌ Missing required options: --admin-email, --admin-password, --admin-name');
      process.exit(1);
    }
    
    // Check if admin email already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === options['admin-email']);
    
    if (existingUser) {
      console.log(`⚠️  Admin email already exists: ${options['admin-email']}`);
      console.log('   Skipping user creation, updating temple settings only...');
      
      // Get existing temple ID first
      const { data: existingTemple } = await supabase
        .from('temple_settings')
        .select('id')
        .single();
      
      if (!existingTemple) {
        throw new Error('No temple found to update');
      }
      
      // Update existing temple settings
      const { error: updateError } = await supabase
        .from('temple_settings')
        .update({
          temple_name: options['temple-name'] || 'Temple Management System',
          temple_description: options['temple-description'] || null,
          temple_address: options['temple-address'] || null,
          temple_phone: options['temple-phone'] || null,
          temple_email: options['temple-email'] || null,
          temple_website: options['temple-website'] || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTemple.id);
      
      if (updateError) {
        throw new Error(`Failed to update temple settings: ${updateError.message}`);
      }
      
      console.log('✅ Temple settings updated successfully!');
      return;
    }
    
    // Check if temple already exists
    const { data: existingTemple } = await supabase
      .from('temple_settings')
      .select('*')
      .single();
    
    if (existingTemple) {
      console.log('⚠️  Temple already exists, updating settings...');
      
      // Update existing temple
      const { error: updateError } = await supabase
        .from('temple_settings')
        .update({
          temple_name: options['temple-name'] || 'Temple Management System',
          temple_description: options['temple-description'] || null,
          temple_address: options['temple-address'] || null,
          temple_phone: options['temple-phone'] || null,
          temple_email: options['temple-email'] || null,
          temple_website: options['temple-website'] || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTemple.id);
      
      if (updateError) {
        throw new Error(`Failed to update temple: ${updateError.message}`);
      }
    } else {
      // Create new temple
      const { data: templeData, error: templeError } = await supabase
        .from('temple_settings')
        .insert({
          temple_name: options['temple-name'] || 'Temple Management System',
          temple_description: options['temple-description'] || null,
          temple_address: options['temple-address'] || null,
          temple_phone: options['temple-phone'] || null,
          temple_email: options['temple-email'] || null,
          temple_website: options['temple-website'] || null,
          is_active: true
        })
        .select()
        .single();
      
      if (templeError) {
        throw new Error(`Failed to create temple: ${templeError.message}`);
      }
      
      console.log(`✅ Temple created: ${templeData.temple_name} (ID: ${templeData.id})`);
    }
    
    // Create the admin user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: options['admin-email'],
      password: options['admin-password'],
      email_confirm: true
    });
    
    if (authError) {
      throw new Error(`Failed to create admin user: ${authError.message}`);
    }
    
    console.log(`✅ Admin user created: ${options['admin-email']} (ID: ${authUser.user.id})`);
    
    // Create admin profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        full_name: options['admin-name'],
        role: 'admin',
        status: 'approved',
        email: options['admin-email'],
        phone: options['admin-phone'] || null,
        nic_number: options['admin-nic'] || null,
        address: options['admin-address'] || null
      });
    
    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to create admin profile: ${profileError.message}`);
    }
    
    console.log(`✅ Admin profile created: ${options['admin-name']}`);
    
    // Update temple with created_by
    const { data: temple } = await supabase.from('temple_settings').select('id').single();
    if (temple) {
      await supabase
        .from('temple_settings')
        .update({ created_by: authUser.user.id })
        .eq('id', temple.id);
    }
    
    console.log('\n🎉 Single temple setup completed successfully!');
    console.log(`\n📋 Login Credentials:`);
    console.log(`   Email: ${options['admin-email']}`);
    console.log(`   Password: ${options['admin-password']}`);
    console.log(`\n🚀 You can now start your application and login!`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Main execution
const options = parseArgs();

// Check for help flags
if (options.help || options.h || process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

setupSingleTemple(options);
