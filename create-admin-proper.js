#!/usr/bin/env node

/**
 * Proper Admin Account Creation Script
 * This script creates admin accounts that work with the current Clerk + Supabase setup
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminProfile(email, fullName, role = 'admin') {
  console.log('🔧 Creating admin profile in Supabase...');
  console.log('📧 Email:', email);
  console.log('👤 Full Name:', fullName);
  console.log('👑 Role:', role);

  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (existingProfile) {
      console.log('⚠️  Profile already exists for this email');
      console.log('📋 Existing profile:', {
        id: existingProfile.id,
        clerk_id: existingProfile.clerk_id,
        role: existingProfile.role,
        is_approved: existingProfile.is_approved
      });
      
      // Ask if user wants to update
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise((resolve) => {
        rl.question('Do you want to update this profile to admin? (y/N): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        // Update existing profile
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            role: role,
            is_approved: true,
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating profile:', updateError.message);
          return;
        }

        console.log('✅ Profile updated successfully!');
        console.log('📋 Updated profile:', updatedProfile);
      } else {
        console.log('❌ Operation cancelled');
        return;
      }
    } else {
      // Create new profile
      const profileData = {
        email: email,
        full_name: fullName,
        is_approved: true,
        role: role,
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating profile:', createError.message);
        return;
      }

      console.log('✅ Admin profile created successfully!');
      console.log('📋 Profile Details:');
      console.log('   ID:', newProfile.id);
      console.log('   Email:', newProfile.email);
      console.log('   Name:', newProfile.full_name);
      console.log('   Role:', newProfile.role);
      console.log('   Status:', newProfile.status);
      console.log('   Approved:', newProfile.is_approved);
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Create a Clerk account with email:', email);
    console.log('2. The system will automatically link the Clerk account to this admin profile');
    console.log('3. Add this email to your VITE_ADMIN_EMAILS in .env file');
    console.log('4. Restart your development server');
    
    console.log('\n📝 Environment Variable to Add:');
    console.log(`VITE_ADMIN_EMAILS=${email}`);
    if (role === 'super_admin') {
      console.log(`VITE_SUPER_ADMIN_EMAILS=${email}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node create-admin-proper.js <email> <full_name> [role]');
    console.log('');
    console.log('Examples:');
    console.log('  node create-admin-proper.js admin@temple.com "Temple Administrator"');
    console.log('  node create-admin-proper.js superadmin@temple.com "Super Admin" super_admin');
    console.log('');
    console.log('Roles: admin, super_admin (default: admin)');
    process.exit(1);
  }

  const email = args[0];
  const fullName = args[1];
  const role = args[2] || 'admin';

  // Validate role
  if (!['admin', 'super_admin'].includes(role)) {
    console.error('❌ Invalid role. Must be "admin" or "super_admin"');
    process.exit(1);
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Invalid email format');
    process.exit(1);
  }

  await createAdminProfile(email, fullName, role);
}

main();
