import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminProfile(email, fullName, clerkId = null) {
  console.log('🔧 Creating admin profile directly in database...');
  console.log('📧 Email:', email);
  console.log('👤 Full Name:', fullName);
  console.log('🆔 Clerk ID:', clerkId || 'Will be generated');

  try {
    // Generate a mock Clerk ID if not provided
    const finalClerkId = clerkId || `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🆔 Using Clerk ID:', finalClerkId);

    // Create admin profile
    const adminProfile = {
      clerk_id: finalClerkId,
      email: email,
      full_name: fullName,
      is_approved: true,
      status: 'approved',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('📊 Creating profile with data:', adminProfile);

    // Try to create the profile with full data first
    let { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert(adminProfile)
      .select()
      .single();

    // If that fails, try with minimal data
    if (profileError) {
      console.log('⚠️  Full profile creation failed, trying minimal data...');
      const minimalProfile = {
        clerk_id: finalClerkId,
        email: email,
        full_name: fullName,
      };

      const { data: minimalProfileData, error: minimalError } = await supabase
        .from('user_profiles')
        .insert(minimalProfile)
        .select()
        .single();

      if (minimalError) {
        console.log('⚠️  Database profile creation failed, but admin profile data is ready');
        console.log('📋 You can manually add this to your database:');
        console.log(JSON.stringify(adminProfile, null, 2));
        console.log('');
        console.log('🔧 Or use this SQL:');
        console.log(`INSERT INTO user_profiles (clerk_id, email, full_name, is_approved, status, role, created_at, updated_at) VALUES ('${finalClerkId}', '${email}', '${fullName}', true, 'approved', 'admin', NOW(), NOW());`);
        
        return {
          success: false,
          error: 'Database creation failed',
          profileData: adminProfile,
          sql: `INSERT INTO user_profiles (clerk_id, email, full_name, is_approved, status, role, created_at, updated_at) VALUES ('${finalClerkId}', '${email}', '${fullName}', true, 'approved', 'admin', NOW(), NOW());`
        };
      } else {
        profile = minimalProfileData;
        console.log('✅ Minimal admin profile created');
      }
    } else {
      console.log('✅ Full admin profile created successfully');
    }

    console.log('\n🎉 Admin profile created successfully!');
    console.log('📊 Profile Details:', {
      id: profile.id,
      clerk_id: profile.clerk_id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      is_approved: profile.is_approved,
      status: profile.status,
    });

    console.log('\n📝 Next Steps:');
    console.log('1. Create a Clerk account manually with this email');
    console.log('2. Use the Clerk ID from above when creating the account');
    console.log('3. Or use the Clerk dashboard to create the user');

    return {
      success: true,
      profile,
      clerkId: finalClerkId,
    };

  } catch (error) {
    console.error('❌ Error creating admin profile:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log('🚀 Direct Admin Profile Creation Script');
  console.log('======================================\n');

  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node create-admin-direct.js <email> <full_name> [clerk_id]');
    console.log('');
    console.log('Examples:');
    console.log('  node create-admin-direct.js admin@temple.com "Admin User"');
    console.log('  node create-admin-direct.js admin@temple.com "Admin User" "user_123456789"');
    console.log('');
    process.exit(1);
  }

  const [email, fullName, clerkId] = args;

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Invalid email format');
    process.exit(1);
  }

  const result = await createAdminProfile(email, fullName, clerkId);

  if (result.success) {
    console.log('\n✅ Admin profile creation completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Admin profile creation failed!');
    if (result.sql) {
      console.log('\n🔧 Manual SQL to run:');
      console.log(result.sql);
    }
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
