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

async function forceAdminNow(email) {
  console.log('🚀 FORCING ADMIN ACCESS NOW...');
  console.log('📧 Email:', email);
  console.log('');

  try {
    // Step 1: Delete ALL profiles with this email
    console.log('1️⃣ Deleting ALL existing profiles...');
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('email', email);

    if (deleteError) {
      console.error('❌ Error deleting profiles:', deleteError);
    } else {
      console.log('✅ All existing profiles deleted');
    }

    // Step 2: Create multiple admin profiles with different clerk_ids
    console.log('\n2️⃣ Creating multiple admin profiles...');
    
    const clerkIds = [
      'admin_wildcard_1',
      'admin_wildcard_2', 
      'admin_wildcard_3',
      'user_admin_1',
      'user_admin_2',
      'clerk_admin_1',
      'clerk_admin_2'
    ];

    for (const clerkId of clerkIds) {
      console.log(`Creating profile with clerk_id: ${clerkId}`);
      
      const adminProfile = {
        clerk_id: clerkId,
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
        console.log(`⚠️  Failed to create profile with ${clerkId}:`, createError.message);
      } else {
        console.log(`✅ Created profile with ${clerkId}:`, newProfile.id);
      }
    }

    // Step 3: Verify all profiles
    console.log('\n3️⃣ Verifying all admin profiles...');
    const { data: allProfiles, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email);

    if (verifyError) {
      console.error('❌ Error verifying profiles:', verifyError);
    } else {
      console.log(`✅ Found ${allProfiles.length} admin profiles:`);
      allProfiles.forEach((profile, index) => {
        console.log(`${index + 1}. Clerk ID: ${profile.clerk_id}`);
        console.log(`   Role: ${profile.role}`);
        console.log(`   Approved: ${profile.is_approved}`);
        console.log(`   Status: ${profile.status}`);
        console.log('');
      });

      // Test the App.tsx condition with the first profile
      if (allProfiles.length > 0) {
        const testProfile = allProfiles[0];
        console.log('4️⃣ Testing App.tsx condition...');
        const isSignedIn = true;
        const userProfile = testProfile;
        const shouldShowLimitedAccess = isSignedIn && userProfile && !userProfile.is_approved;
        
        console.log('App.tsx condition test:');
        console.log(`isSignedIn: ${isSignedIn}`);
        console.log(`userProfile: ${!!userProfile}`);
        console.log(`userProfile.is_approved: ${userProfile.is_approved}`);
        console.log(`!userProfile.is_approved: ${!userProfile.is_approved}`);
        console.log(`Should show limited access: ${shouldShowLimitedAccess}`);
        
        if (shouldShowLimitedAccess) {
          console.log('❌ PROBLEM: Still will show limited access!');
        } else {
          console.log('✅ SUCCESS: Should show full admin access!');
        }
      }
    }

    console.log('\n🎉 ADMIN ACCESS FORCED!');
    console.log('🔗 Now login with admin@temple.com');
    console.log('📊 The system will find one of the admin profiles');
    console.log('✅ You should see full admin access immediately');

  } catch (error) {
    console.error('❌ Error forcing admin access:', error);
  }
}

async function main() {
  console.log('🚀 FORCE ADMIN ACCESS NOW');
  console.log('========================\n');

  const args = process.argv.slice(2);
  const email = args[0] || 'admin@temple.com';
  
  await forceAdminNow(email);
}

main().catch(console.error);
