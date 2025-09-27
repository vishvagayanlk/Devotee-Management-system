import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminClerkId(email, newClerkId) {
  console.log('🔧 Fixing admin Clerk ID...');
  console.log('📧 Email:', email);
  console.log('🆔 New Clerk ID:', newClerkId);

  try {
    // First, check if there are multiple admin profiles with the same email
    const { data: existingProfiles, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email);

    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError);
      return;
    }

    console.log(`📊 Found ${existingProfiles.length} profiles with email ${email}`);

    if (existingProfiles.length === 0) {
      console.log('❌ No profiles found with that email');
      return;
    }

    // Delete all existing profiles with this email
    console.log('🗑️  Deleting existing profiles...');
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('email', email);

    if (deleteError) {
      console.error('❌ Error deleting existing profiles:', deleteError);
      return;
    }

    console.log('✅ Existing profiles deleted');

    // Create new admin profile with correct Clerk ID
    console.log('➕ Creating new admin profile with correct Clerk ID...');
    const adminProfile = {
      clerk_id: newClerkId,
      email: email,
      full_name: 'Temple Administrator',
      is_approved: true,
      status: 'approved',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert(adminProfile)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating new profile:', createError);
      return;
    }

    console.log('✅ New admin profile created successfully!');
    console.log('📊 Profile Details:', {
      id: newProfile.id,
      clerk_id: newProfile.clerk_id,
      email: newProfile.email,
      full_name: newProfile.full_name,
      role: newProfile.role,
      is_approved: newProfile.is_approved,
      status: newProfile.status,
    });

    console.log('\n🎉 Admin account fixed!');
    console.log('🔗 You can now login with:');
    console.log('📧 Email:', email);
    console.log('🆔 Clerk ID:', newClerkId);

  } catch (error) {
    console.error('❌ Error fixing admin Clerk ID:', error);
  }
}

async function main() {
  console.log('🚀 Fix Admin Clerk ID Script');
  console.log('============================\n');

  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node fix-admin-clerk-id.js <email> <clerk_user_id>');
    console.log('');
    console.log('Example:');
    console.log('  node fix-admin-clerk-id.js admin@temple.com user_123456789');
    console.log('');
    console.log('To find your Clerk User ID:');
    console.log('1. Login to your app');
    console.log('2. Open browser console (F12)');
    console.log('3. Look for "Clerk user authenticated" logs');
    console.log('4. Copy the user ID from the logs');
    process.exit(1);
  }

  const [email, clerkId] = args;

  await fixAdminClerkId(email, clerkId);
}

main().catch(console.error);
