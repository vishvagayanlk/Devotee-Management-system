import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';

dotenv.config();

function setupAdminConfig() {
  console.log('🔧 Setting up Admin Configuration');
  console.log('=================================');
  console.log('');

  const envFile = '.env';
  const envExampleFile = '.env.example';

  // Check if .env file exists
  if (!existsSync(envFile)) {
    console.log('❌ .env file not found');
    console.log('Please create a .env file with your configuration');
    return;
  }

  // Read current .env file
  const envContent = readFileSync(envFile, 'utf8');
  const lines = envContent.split('\n');

  // Check for existing admin configuration
  const hasAdminEmails = lines.some(line => line.startsWith('VITE_ADMIN_EMAILS='));
  const hasAdminDomains = lines.some(line => line.startsWith('VITE_ADMIN_DOMAINS='));
  const hasAdminPatterns = lines.some(line => line.startsWith('VITE_ADMIN_PATTERNS='));

  console.log('📋 Current Admin Configuration:');
  console.log(`VITE_ADMIN_EMAILS: ${hasAdminEmails ? '✅ Set' : '❌ Not set'}`);
  console.log(`VITE_ADMIN_DOMAINS: ${hasAdminDomains ? '✅ Set' : '❌ Not set'}`);
  console.log(`VITE_ADMIN_PATTERNS: ${hasAdminPatterns ? '✅ Set' : '❌ Not set'}`);
  console.log('');

  if (!hasAdminEmails && !hasAdminDomains && !hasAdminPatterns) {
    console.log('🔧 Adding default admin configuration...');
    
    const defaultConfig = [
      '',
      '# Admin Configuration',
      'VITE_ADMIN_EMAILS=admin@temple.com,admin@yourdomain.com',
      'VITE_ADMIN_DOMAINS=temple.com,yourdomain.com',
      'VITE_ADMIN_PATTERNS=admin,manager,supervisor',
      'VITE_SUPER_ADMIN_EMAILS=superadmin@temple.com'
    ];

    const newContent = envContent + '\n' + defaultConfig.join('\n');
    writeFileSync(envFile, newContent);
    
    console.log('✅ Default admin configuration added to .env file');
    console.log('');
    console.log('📝 You can now customize the admin configuration:');
    console.log('- Edit VITE_ADMIN_EMAILS for specific admin emails');
    console.log('- Edit VITE_ADMIN_DOMAINS for admin domains');
    console.log('- Edit VITE_ADMIN_PATTERNS for admin patterns');
    console.log('- Edit VITE_SUPER_ADMIN_EMAILS for super admin emails');
  } else {
    console.log('✅ Admin configuration already exists');
    console.log('');
    console.log('📝 Current configuration:');
    
    lines.forEach(line => {
      if (line.startsWith('VITE_ADMIN_') || line.startsWith('VITE_SUPER_')) {
        console.log(`  ${line}`);
      }
    });
  }

  console.log('');
  console.log('🚀 Next steps:');
  console.log('1. Customize the admin configuration in your .env file');
  console.log('2. Restart your development server');
  console.log('3. Test admin access with configured emails');
  console.log('4. Deploy to Vercel with the same environment variables');
}

setupAdminConfig();
