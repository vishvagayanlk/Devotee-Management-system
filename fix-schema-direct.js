import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSchema() {
  console.log('🔧 Fixing database schema...');

  try {
    // Test connection
    console.log('📋 Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Cannot access user_profiles table:', testError);
      return;
    }

    console.log('✅ Database connection successful');

    // Try to create a minimal profile first to test
    console.log('🧪 Testing minimal profile creation...');
    const testProfile = {
      clerk_id: 'test_user_' + Date.now(),
      email: 'test@example.com',
      full_name: 'Test User',
    };

    const { data: testResult, error: testError2 } = await supabase
      .from('user_profiles')
      .insert(testProfile)
      .select()
      .single();

    if (testError2) {
      console.log('⚠️  Minimal profile creation failed:', testError2.message);
      
      // Try with even more minimal data
      console.log('🧪 Trying with just clerk_id...');
      const minimalProfile = {
        clerk_id: 'test_user_minimal_' + Date.now(),
      };

      const { data: minimalResult, error: minimalError } = await supabase
        .from('user_profiles')
        .insert(minimalProfile)
        .select()
        .single();

      if (minimalError) {
        console.error('❌ Even minimal profile creation failed:', minimalError.message);
        console.log('🔧 This suggests the database schema needs to be fixed manually');
        console.log('📝 Please run the SQL script: fix-complete-schema.sql');
        return;
      } else {
        console.log('✅ Minimal profile creation successful:', minimalResult);
        
        // Clean up test data
        await supabase
          .from('user_profiles')
          .delete()
          .eq('clerk_id', minimalProfile.clerk_id);
        console.log('🧹 Test data cleaned up');
      }
    } else {
      console.log('✅ Test profile creation successful:', testResult);
      
      // Clean up test data
      await supabase
        .from('user_profiles')
        .delete()
        .eq('clerk_id', testProfile.clerk_id);
      console.log('🧹 Test data cleaned up');
    }

    console.log('🎉 Schema test completed!');

  } catch (error) {
    console.error('❌ Error testing schema:', error);
  }
}

fixSchema();
