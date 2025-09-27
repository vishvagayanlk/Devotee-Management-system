import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createVercelAdmin() {
  console.log('🚀 Creating Vercel Admin Profile');
  console.log('================================');
  console.log('');

  const adminEmails = [
    'admin@temple.com',
    'admin@devotee-management-system.vercel.app',
    'admin@localhost',
    'temple.admin@gmail.com',
    'admin@example.com'
  ];

  try {
    // Test connection first
    console.log('1️⃣ Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      return;
    }
    console.log('✅ Supabase connection successful');

    // Create admin profiles for all possible admin emails
    console.log('\n2️⃣ Creating admin profiles for all admin emails...');
    
    for (const email of adminEmails) {
      console.log(`Creating admin profile for: ${email}`);
      
      // Delete any existing profiles for this email
      await supabase
        .from('user_profiles')
        .delete()
        .eq('email', email);

      // Create admin profile with multiple possible clerk_ids
      const possibleClerkIds = [
        `admin_${email.replace('@', '_').replace('.', '_')}_1`,
        `admin_${email.replace('@', '_').replace('.', '_')}_2`,
        `user_${email.replace('@', '_').replace('.', '_')}_1`,
        `clerk_${email.replace('@', '_').replace('.', '_')}_1`,
        `vercel_${email.replace('@', '_').replace('.', '_')}_1`
      ];

      for (const clerkId of possibleClerkIds) {
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
          console.log(`  ⚠️  Failed to create profile with ${clerkId}: ${createError.message}`);
        } else {
          console.log(`  ✅ Created profile with ${clerkId}: ${newProfile.id}`);
        }
      }
    }

    // Verify all admin profiles
    console.log('\n3️⃣ Verifying all admin profiles...');
    const { data: allProfiles, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('email', adminEmails);

    if (verifyError) {
      console.error('❌ Error verifying profiles:', verifyError);
    } else {
      console.log(`✅ Found ${allProfiles.length} admin profiles:`);
      
      const profilesByEmail = {};
      allProfiles.forEach(profile => {
        if (!profilesByEmail[profile.email]) {
          profilesByEmail[profile.email] = [];
        }
        profilesByEmail[profile.email].push(profile);
      });

      Object.entries(profilesByEmail).forEach(([email, profiles]) => {
        console.log(`\n📧 ${email}: ${profiles.length} profiles`);
        profiles.forEach((profile, index) => {
          console.log(`  ${index + 1}. Clerk ID: ${profile.clerk_id}`);
          console.log(`     Role: ${profile.role}, Approved: ${profile.is_approved}`);
        });
      });
    }

    console.log('\n🎉 Vercel admin profiles created successfully!');
    console.log('🔗 Now deploy to Vercel and test admin login');
    console.log('📊 The system will find one of the admin profiles for any admin email');

  } catch (error) {
    console.error('❌ Error creating Vercel admin profiles:', error);
  }
}

createVercelAdmin();
