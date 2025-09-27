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

async function fixAdminClerkMismatch(email, realClerkId) {
  console.log('🔧 Fixing admin Clerk ID mismatch...');
  console.log('📧 Email:', email);
  console.log('🆔 Real Clerk ID:', realClerkId);

  try {
    // Step 1: Find the admin profile by email
    console.log('\n1️⃣ Finding admin profile by email...');
    const { data: emailProfile, error: emailError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (emailError) {
      console.error('❌ Error finding profile by email:', emailError);
      return;
    }

    console.log('✅ Found admin profile:', {
      id: emailProfile.id,
      current_clerk_id: emailProfile.clerk_id,
      email: emailProfile.email,
      role: emailProfile.role,
      is_approved: emailProfile.is_approved,
      status: emailProfile.status,
    });

    // Step 2: Update the profile with the real Clerk ID
    console.log('\n2️⃣ Updating profile with real Clerk ID...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        clerk_id: realClerkId,
        updated_at: new Date().toISOString()
      })
      .eq('id', emailProfile.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return;
    }

    console.log('✅ Profile updated successfully');
    console.log('📊 Updated profile:', {
      id: updatedProfile.id,
      clerk_id: updatedProfile.clerk_id,
      email: updatedProfile.email,
      role: updatedProfile.role,
      is_approved: updatedProfile.is_approved,
      status: updatedProfile.status,
    });

    // Step 3: Test the profile lookup with the real Clerk ID
    console.log('\n3️⃣ Testing profile lookup with real Clerk ID...');
    const { data: testProfile, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('clerk_id', realClerkId)
      .single();

    if (testError) {
      console.error('❌ Error testing profile lookup:', testError);
    } else {
      console.log('✅ Profile lookup test successful');
      console.log('📊 Test profile:', {
        id: testProfile.id,
        clerk_id: testProfile.clerk_id,
        email: testProfile.email,
        role: testProfile.role,
        is_approved: testProfile.is_approved,
        status: testProfile.status,
      });

      // Test the App.tsx condition
      console.log('\n4️⃣ Testing App.tsx condition...');
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

    console.log('\n🎉 Admin Clerk ID mismatch fixed!');
    console.log('🔗 You can now login and should see full admin access');

  } catch (error) {
    console.error('❌ Error fixing admin Clerk mismatch:', error);
  }
}

async function main() {
  console.log('🚀 Fix Admin Clerk Mismatch Script');
  console.log('==================================\n');

  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node fix-admin-clerk-mismatch.js <email> <real_clerk_id>');
    console.log('');
    console.log('To find your real Clerk ID:');
    console.log('1. Login to your app with admin@temple.com');
    console.log('2. Open browser console (F12)');
    console.log('3. Look for logs like "Clerk user authenticated" or "User ID:"');
    console.log('4. Copy the user ID from the logs');
    console.log('');
    console.log('Example:');
    console.log('  node fix-admin-clerk-mismatch.js admin@temple.com user_123456789');
    process.exit(1);
  }

  const [email, realClerkId] = args;
  await fixAdminClerkMismatch(email, realClerkId);
}

main().catch(console.error);
