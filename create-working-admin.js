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

async function createWorkingAdmin(email) {
  console.log('🔧 Creating working admin profile...');
  console.log('📧 Email:', email);

  try {
    // Step 1: Delete all existing profiles with this email
    console.log('\n1️⃣ Cleaning up existing profiles...');
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('email', email);

    if (deleteError) {
      console.error('❌ Error deleting existing profiles:', deleteError);
    } else {
      console.log('✅ Existing profiles deleted');
    }

    // Step 2: Create a new admin profile with a wildcard clerk_id
    console.log('\n2️⃣ Creating new admin profile...');
    
    const adminProfile = {
      clerk_id: `admin_${Date.now()}_wildcard`, // Use a unique wildcard ID
      email: email,
      full_name: 'Temple Administrator',
      is_approved: true,
      status: 'approved',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('📊 Creating profile with data:', adminProfile);

    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert(adminProfile)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating profile:', createError);
      
      // Try with minimal data
      console.log('\n🔄 Trying with minimal data...');
      const minimalProfile = {
        clerk_id: `admin_${Date.now()}_minimal`,
        email: email,
        full_name: 'Temple Administrator',
      };

      const { data: minimalData, error: minimalError } = await supabase
        .from('user_profiles')
        .insert(minimalProfile)
        .select()
        .single();

      if (minimalError) {
        console.error('❌ Minimal profile creation also failed:', minimalError);
        return;
      } else {
        console.log('✅ Minimal profile created, updating with admin data...');
        
        // Update the minimal profile with admin data
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            is_approved: true,
            status: 'approved',
            role: 'admin',
            updated_at: new Date().toISOString(),
          })
          .eq('id', minimalData.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating minimal profile:', updateError);
          return;
        } else {
          console.log('✅ Profile updated with admin data');
          console.log('📊 Final profile:', updatedProfile);
        }
      }
    } else {
      console.log('✅ Admin profile created successfully');
      console.log('📊 Created profile:', newProfile);
    }

    // Step 3: Verify the profile
    console.log('\n3️⃣ Verifying admin profile...');
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying profile:', verifyError);
    } else {
      console.log('✅ Profile verification successful');
      console.log('📊 Verified profile:', {
        id: verifyProfile.id,
        clerk_id: verifyProfile.clerk_id,
        email: verifyProfile.email,
        role: verifyProfile.role,
        is_approved: verifyProfile.is_approved,
        status: verifyProfile.status,
      });

      // Test the App.tsx condition
      console.log('\n4️⃣ Testing App.tsx condition...');
      const isSignedIn = true;
      const userProfile = verifyProfile;
      const shouldShowLimitedAccess = isSignedIn && userProfile && !userProfile.is_approved;
      
      console.log('App.tsx condition test:');
      console.log(`isSignedIn: ${isSignedIn}`);
      console.log(`userProfile: ${!!userProfile}`);
      console.log(`userProfile.is_approved: ${userProfile.is_approved}`);
      console.log(`!userProfile.is_approved: ${!userProfile.is_approved}`);
      console.log(`Should show limited access: ${shouldShowLimitedAccess}`);
      
      if (shouldShowLimitedAccess) {
        console.log('❌ PROBLEM: Still will show limited access!');
        console.log('🔍 Debugging the is_approved field:');
        console.log(`Type: ${typeof userProfile.is_approved}`);
        console.log(`Value: "${userProfile.is_approved}"`);
        console.log(`=== true: ${userProfile.is_approved === true}`);
        console.log(`=== false: ${userProfile.is_approved === false}`);
        console.log(`== true: ${userProfile.is_approved == true}`);
        console.log(`== false: ${userProfile.is_approved == false}`);
        console.log(`Boolean(): ${Boolean(userProfile.is_approved)}`);
        console.log(`!!: ${!!userProfile.is_approved}`);
      } else {
        console.log('✅ SUCCESS: Should show full admin access!');
      }
    }

    console.log('\n🎉 Working admin profile created!');
    console.log('🔗 You can now login and should see admin access');

  } catch (error) {
    console.error('❌ Error creating working admin:', error);
  }
}

async function main() {
  console.log('🚀 Create Working Admin Profile Script');
  console.log('=====================================\n');

  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node create-working-admin.js <email>');
    console.log('');
    console.log('Example:');
    console.log('  node create-working-admin.js admin@temple.com');
    process.exit(1);
  }

  const email = args[0];
  await createWorkingAdmin(email);
}

main().catch(console.error);
