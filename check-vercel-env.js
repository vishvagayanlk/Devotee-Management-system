import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Vercel Environment Check');
console.log('==========================');
console.log('');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('CLERK_PUBLISHABLE_KEY:', process.env.VITE_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing');
console.log('CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing');

console.log('');

// Check if we're in Vercel environment
console.log('🌐 Environment Detection:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('VERCEL:', process.env.VERCEL ? '✅ Vercel detected' : '❌ Not Vercel');
console.log('VERCEL_ENV:', process.env.VERCEL_ENV || 'Not set');
console.log('VERCEL_URL:', process.env.VERCEL_URL || 'Not set');

console.log('');

// Check admin email configuration
const adminEmails = [
  'admin@temple.com',
  'admin@devotee-management-system.vercel.app',
  'admin@localhost',
  'temple.admin@gmail.com',
  'admin@example.com'
];

console.log('👑 Admin Email Configuration:');
adminEmails.forEach((email, index) => {
  console.log(`${index + 1}. ${email}`);
});

console.log('');

// Test Supabase connection
console.log('🔗 Testing Supabase Connection...');
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  supabase
    .from('user_profiles')
    .select('count')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Supabase connection failed:', error.message);
      } else {
        console.log('✅ Supabase connection successful');
      }
    })
    .catch(err => {
      console.log('❌ Supabase connection error:', err.message);
    });
} else {
  console.log('❌ Cannot test Supabase - missing environment variables');
}

console.log('');
console.log('💡 If you see issues:');
console.log('1. Check Vercel environment variables in dashboard');
console.log('2. Redeploy after setting environment variables');
console.log('3. Check browser console for detailed error logs');
console.log('4. Verify admin email is in the admin emails list');
