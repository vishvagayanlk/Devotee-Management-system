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

async function testProfileLookup(email) {
  console.log('🧪 Testing profile lookup...');
  console.log('📧 Email:', email);

  try {
    // Test 1: Lookup by email (the fallback method)
    console.log('\n1️⃣ Testing email lookup...');
    const { data: emailProfile, error: emailError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (emailError) {
      console.error('❌ Email lookup failed:', emailError);
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
      
      // Test the condition that App.tsx uses
      const shouldShowLimitedAccess = !emailProfile.is_approved;
      console.log('\n🔍 App.tsx condition test:');
      console.log(`is_approved: ${emailProfile.is_approved}`);
      console.log(`!is_approved: ${!emailProfile.is_approved}`);
      console.log(`Should show limited access: ${shouldShowLimitedAccess}`);
      
      if (shouldShowLimitedAccess) {
        console.log('❌ PROBLEM: This profile will show limited access!');
        console.log('🔧 The is_approved field might be a string instead of boolean');
        
        // Check the actual type
        console.log(`Type of is_approved: ${typeof emailProfile.is_approved}`);
        console.log(`Value: "${emailProfile.is_approved}"`);
        
        // Test different boolean checks
        console.log('\n🧪 Testing different boolean checks:');
        console.log(`=== false: ${emailProfile.is_approved === false}`);
        console.log(`=== true: ${emailProfile.is_approved === true}`);
        console.log(`== false: ${emailProfile.is_approved == false}`);
        console.log(`== true: ${emailProfile.is_approved == true}`);
        console.log(`Boolean(): ${Boolean(emailProfile.is_approved)}`);
        console.log(`!!: ${!!emailProfile.is_approved}`);
      } else {
        console.log('✅ This profile should show full admin access');
      }
    }

  } catch (error) {
    console.error('❌ Error testing profile lookup:', error);
  }
}

async function main() {
  console.log('🚀 Profile Lookup Test');
  console.log('======================\n');

  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node test-profile-lookup.js <email>');
    console.log('');
    console.log('Example:');
    console.log('  node test-profile-lookup.js admin@temple.com');
    process.exit(1);
  }

  const email = args[0];
  await testProfileLookup(email);
}

main().catch(console.error);
