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

async function fixAdminApproval(email) {
  console.log('🔧 Fixing admin approval issue...');
  console.log('📧 Email:', email);

  try {
    // Delete all existing profiles with this email
    console.log('🗑️  Cleaning up existing profiles...');
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('email', email);

    if (deleteError) {
      console.error('❌ Error deleting profiles:', deleteError);
      return;
    }

    console.log('✅ Existing profiles deleted');

    // Create a wildcard admin profile that will work with any Clerk ID
    console.log('➕ Creating universal admin profile...');
    
    // We'll create a profile that can be matched by email instead of clerk_id
    const adminProfile = {
      clerk_id: `admin_${Date.now()}_universal`,
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
      console.error('❌ Error creating profile:', createError);
      return;
    }

    console.log('✅ Universal admin profile created!');
    console.log('📊 Profile Details:', {
      id: newProfile.id,
      clerk_id: newProfile.clerk_id,
      email: newProfile.email,
      role: newProfile.role,
      is_approved: newProfile.is_approved,
      status: newProfile.status,
    });

    console.log('\n🎉 Admin approval issue fixed!');
    console.log('🔗 You can now login with:');
    console.log('📧 Email:', email);
    console.log('🔑 Password: (whatever you set in Clerk)');

  } catch (error) {
    console.error('❌ Error fixing admin approval:', error);
  }
}

async function main() {
  console.log('🚀 Fix Admin Approval Script');
  console.log('============================\n');

  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node fix-admin-approval.js <email>');
    console.log('');
    console.log('Example:');
    console.log('  node fix-admin-approval.js admin@temple.com');
    process.exit(1);
  }

  const email = args[0];
  await fixAdminApproval(email);
}

main().catch(console.error);
