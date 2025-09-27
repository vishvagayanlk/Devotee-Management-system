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

async function testAdminFix() {
  console.log('🧪 Testing admin fix...');
  console.log('');

  try {
    // Check current admin profiles
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'admin@temple.com');

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }

    console.log(`📊 Found ${profiles.length} admin profile(s):`);
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ID: ${profile.id}`);
      console.log(`   Clerk ID: ${profile.clerk_id}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Approved: ${profile.is_approved}`);
      console.log(`   Status: ${profile.status}`);
      console.log('');
    });

    if (profiles.length === 0) {
      console.log('❌ No admin profiles found!');
      console.log('Run: node fix-admin-approval.js admin@temple.com');
      return;
    }

    console.log('✅ Admin profiles are ready!');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('1. Login to your app with admin@temple.com');
    console.log('2. The system will automatically find the profile by email');
    console.log('3. It will update the clerk_id to match your Clerk user');
    console.log('4. You should see admin access instead of pending approval');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAdminFix();
