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

async function debugProfileLoading() {
  console.log('🔍 Debugging profile loading process...');
  console.log('');

  const email = 'admin@temple.com';
  const mockClerkUserId = 'user_mock123456789'; // Simulate a Clerk user ID

  try {
    // Step 1: Try to find profile by clerk_id (this will fail)
    console.log('1️⃣ Testing profile lookup by clerk_id...');
    console.log(`Looking for clerk_id: ${mockClerkUserId}`);
    
    const { data: clerkProfile, error: clerkError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('clerk_id', mockClerkUserId)
      .single();

    console.log('Clerk ID lookup result:', { clerkProfile, clerkError });
    
    if (clerkError && clerkError.code === 'PGRST116') {
      console.log('✅ No profile found by clerk_id (expected)');
      console.log('Error code:', clerkError.code);
    } else if (clerkError) {
      console.log('❌ Unexpected error:', clerkError);
    } else {
      console.log('✅ Profile found by clerk_id:', clerkProfile);
    }

    // Step 2: Try email fallback (this should work)
    console.log('\n2️⃣ Testing email fallback lookup...');
    console.log(`Looking for email: ${email}`);
    
    const { data: emailProfile, error: emailError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    console.log('Email lookup result:', { emailProfile, emailError });
    
    if (emailError) {
      console.log('❌ Email lookup failed:', emailError);
    } else {
      console.log('✅ Email lookup successful');
      console.log('📊 Profile data:', {
        id: emailProfile.id,
        clerk_id: emailProfile.clerk_id,
        email: emailProfile.email,
        role: emailProfile.role,
        is_approved: emailProfile.is_approved,
        status: emailProfile.status,
      });

      // Step 3: Test the App.tsx condition
      console.log('\n3️⃣ Testing App.tsx condition...');
      const isSignedIn = true; // Simulate signed in
      const userProfile = emailProfile; // Use the found profile
      
      console.log('App.tsx variables:');
      console.log(`isSignedIn: ${isSignedIn}`);
      console.log(`userProfile: ${!!userProfile}`);
      console.log(`userProfile.is_approved: ${userProfile.is_approved}`);
      console.log(`!userProfile.is_approved: ${!userProfile.is_approved}`);
      
      const shouldShowLimitedAccess = isSignedIn && userProfile && !userProfile.is_approved;
      console.log(`Should show limited access: ${shouldShowLimitedAccess}`);
      
      if (shouldShowLimitedAccess) {
        console.log('❌ PROBLEM: This will show limited access!');
        console.log('🔍 Debugging the condition:');
        console.log(`  isSignedIn && userProfile: ${isSignedIn && !!userProfile}`);
        console.log(`  !userProfile.is_approved: ${!userProfile.is_approved}`);
        console.log(`  Combined: ${(isSignedIn && !!userProfile) && !userProfile.is_approved}`);
      } else {
        console.log('✅ This should show full admin access');
      }

      // Step 4: Test what happens when we update the clerk_id
      console.log('\n4️⃣ Testing clerk_id update...');
      console.log('Updating profile with mock Clerk user ID...');
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({ clerk_id: mockClerkUserId })
        .eq('id', emailProfile.id)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Update failed:', updateError);
      } else {
        console.log('✅ Update successful');
        console.log('📊 Updated profile:', {
          id: updatedProfile.id,
          clerk_id: updatedProfile.clerk_id,
          email: updatedProfile.email,
          role: updatedProfile.role,
          is_approved: updatedProfile.is_approved,
          status: updatedProfile.status,
        });

        // Test the condition again with updated profile
        console.log('\n5️⃣ Testing condition with updated profile...');
        const updatedUserProfile = updatedProfile;
        const shouldShowLimitedAccessUpdated = isSignedIn && updatedUserProfile && !updatedUserProfile.is_approved;
        console.log(`Should show limited access (updated): ${shouldShowLimitedAccessUpdated}`);
      }
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

debugProfileLoading();
