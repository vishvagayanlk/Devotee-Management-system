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

async function forceAdminApproval(email) {
  console.log('🔧 Forcing admin approval...');
  console.log('📧 Email:', email);

  try {
    // Find the admin profile by email
    const { data: profiles, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email);

    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError);
      return;
    }

    if (profiles.length === 0) {
      console.log('❌ No profiles found with that email');
      return;
    }

    console.log(`📊 Found ${profiles.length} profile(s) with email: ${email}`);

    // Update all profiles to ensure they are admin and approved
    for (const profile of profiles) {
      console.log(`\n🔄 Updating profile ${profile.id}...`);
      
      const updateData = {
        is_approved: true,
        status: 'approved',
        role: 'admin',
        updated_at: new Date().toISOString(),
      };

      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .single();

      if (updateError) {
        console.error(`❌ Error updating profile ${profile.id}:`, updateError);
      } else {
        console.log(`✅ Profile ${profile.id} updated successfully`);
        console.log('📊 Updated data:', {
          id: updatedProfile.id,
          clerk_id: updatedProfile.clerk_id,
          email: updatedProfile.email,
          role: updatedProfile.role,
          is_approved: updatedProfile.is_approved,
          status: updatedProfile.status,
        });
      }
    }

    console.log('\n🎉 All admin profiles updated successfully!');
    console.log('🔗 You can now login and should see full admin access');

  } catch (error) {
    console.error('❌ Error forcing admin approval:', error);
  }
}

async function main() {
  console.log('🚀 Force Admin Approval Script');
  console.log('==============================\n');

  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node force-admin-approval.js <email>');
    console.log('');
    console.log('Example:');
    console.log('  node force-admin-approval.js admin@temple.com');
    process.exit(1);
  }

  const email = args[0];
  await forceAdminApproval(email);
}

main().catch(console.error);
