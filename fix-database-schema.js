const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema...');

  try {
    // Check current schema
    console.log('📋 Checking current schema...');
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'user_profiles' });

    if (schemaError) {
      console.log('Using alternative method to check schema...');
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('❌ Cannot access user_profiles table:', testError);
        return;
      }
    }

    console.log('✅ Database connection successful');

    // Try to add missing columns using SQL
    console.log('🔨 Adding missing columns...');
    
    const sqlCommands = [
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name TEXT;`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name TEXT;`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;`
    ];

    for (const sql of sqlCommands) {
      try {
        console.log(`Executing: ${sql}`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
          console.log(`⚠️  Warning for "${sql}":`, error.message);
        } else {
          console.log(`✅ Success: ${sql}`);
        }
      } catch (err) {
        console.log(`⚠️  Warning for "${sql}":`, err.message);
      }
    }

    // Test profile creation
    console.log('🧪 Testing profile creation...');
    const testProfile = {
      clerk_id: 'test_user_' + Date.now(),
      email: 'test@example.com',
      full_name: 'Test User',
      is_approved: false,
      status: 'pending',
      role: 'devotee',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: testResult, error: testError } = await supabase
      .from('user_profiles')
      .insert(testProfile)
      .select()
      .single();

    if (testError) {
      console.error('❌ Test profile creation failed:', testError);
    } else {
      console.log('✅ Test profile creation successful:', testResult);
      
      // Clean up test data
      await supabase
        .from('user_profiles')
        .delete()
        .eq('clerk_id', testProfile.clerk_id);
      console.log('🧹 Test data cleaned up');
    }

    console.log('🎉 Database schema fix completed!');

  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
  }
}

fixDatabaseSchema();
