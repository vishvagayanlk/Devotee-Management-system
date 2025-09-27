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

async function findClerkId(email) {
  console.log('🔍 Finding Clerk ID for email:', email);
  console.log('');

  try {
    // Check all profiles with this email
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email);

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }

    if (profiles.length === 0) {
      console.log('❌ No profiles found with that email');
      return;
    }

    console.log(`📊 Found ${profiles.length} profile(s) with email: ${email}`);
    console.log('');

    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. Profile ID: ${profile.id}`);
      console.log(`   Clerk ID: ${profile.clerk_id}`);
      console.log(`   Full Name: ${profile.full_name}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Approved: ${profile.is_approved}`);
      console.log(`   Status: ${profile.status}`);
      console.log(`   Created: ${profile.created_at}`);
      console.log('');
    });

    console.log('💡 To fix the admin account:');
    console.log('1. Login to your app with this email');
    console.log('2. Open browser console (F12)');
    console.log('3. Look for "Clerk user authenticated" logs');
    console.log('4. Copy the actual Clerk user ID from the logs');
    console.log('5. Run: node fix-admin-clerk-id.js <email> <actual_clerk_id>');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  console.log('🚀 Find Clerk ID Script');
  console.log('======================\n');

  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node find-clerk-id.js <email>');
    console.log('');
    console.log('Example:');
    console.log('  node find-clerk-id.js admin@temple.com');
    process.exit(1);
  }

  const email = args[0];
  await findClerkId(email);
}

main().catch(console.error);
