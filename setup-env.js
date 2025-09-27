#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Setting up environment variables for Clerk Authentication...\n');

const envContent = `# 🔐 Clerk Authentication Configuration
# Get these keys from https://dashboard.clerk.com/
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# 🗄️ Supabase Database Configuration
# Get these from your Supabase project settings
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# 📊 Optional: Monitoring & Analytics
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint_here
`;

const envPath = path.join(__dirname, '.env.local');

try {
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists. Backing up to .env.local.backup');
    fs.copyFileSync(envPath, envPath + '.backup');
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
  console.log('\n📝 Next steps:');
  console.log('1. Go to https://dashboard.clerk.com/');
  console.log('2. Create a new application or use existing');
  console.log('3. Copy your publishable key (starts with pk_)');
  console.log('4. Copy your secret key (starts with sk_)');
  console.log('5. Update the .env.local file with your actual keys');
  console.log('6. Run: npm run dev');
  console.log('\n🎉 Your signup/signin flow will work once you add the Clerk keys!');
  
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
  console.log('\n📝 Manual setup:');
  console.log('1. Create a file named .env.local in the project root');
  console.log('2. Add the environment variables shown above');
  console.log('3. Get your Clerk keys from https://dashboard.clerk.com/');
  console.log('4. Replace the placeholder values with your actual keys');
}
