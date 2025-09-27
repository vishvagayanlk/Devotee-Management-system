import dotenv from 'dotenv';

dotenv.config();

// Test the admin detection logic
function testAdminDetection() {
  console.log('🔍 Debugging Admin Detection');
  console.log('============================');
  console.log('');

  // Get admin configuration from environment variables
  const adminEmailsEnv = process.env.VITE_ADMIN_EMAILS || '';
  const adminDomainsEnv = process.env.VITE_ADMIN_DOMAINS || '';
  const adminPatternsEnv = process.env.VITE_ADMIN_PATTERNS || 'admin';
  const superAdminEmailsEnv = process.env.VITE_SUPER_ADMIN_EMAILS || '';

  console.log('📋 Environment Variables:');
  console.log('VITE_ADMIN_EMAILS:', adminEmailsEnv);
  console.log('VITE_ADMIN_DOMAINS:', adminDomainsEnv);
  console.log('VITE_ADMIN_PATTERNS:', adminPatternsEnv);
  console.log('VITE_SUPER_ADMIN_EMAILS:', superAdminEmailsEnv);
  console.log('');

  // Parse the configuration
  const adminEmails = adminEmailsEnv 
    ? adminEmailsEnv.split(',').map(email => email.trim().toLowerCase())
    : [];

  const adminDomains = adminDomainsEnv 
    ? adminDomainsEnv.split(',').map(domain => domain.trim().toLowerCase())
    : [];

  const adminPatterns = adminPatternsEnv 
    ? adminPatternsEnv.split(',').map(pattern => pattern.trim().toLowerCase())
    : ['admin'];

  const superAdminEmails = superAdminEmailsEnv 
    ? superAdminEmailsEnv.split(',').map(email => email.trim().toLowerCase())
    : [];

  console.log('📊 Parsed Configuration:');
  console.log('Admin Emails:', adminEmails);
  console.log('Admin Domains:', adminDomains);
  console.log('Admin Patterns:', adminPatterns);
  console.log('Super Admin Emails:', superAdminEmails);
  console.log('');

  // Test admin detection function
  function isAdminEmail(email) {
    if (!email) return false;
    
    const emailLower = email.toLowerCase();

    // Check exact email matches
    if (adminEmails.includes(emailLower)) {
      console.log(`✅ Exact email match: ${email}`);
      return true;
    }

    // Check super admin emails
    if (superAdminEmails.includes(emailLower)) {
      console.log(`✅ Super admin email match: ${email}`);
      return true;
    }

    // Check domain matches
    const emailDomain = emailLower.split('@')[1];
    if (emailDomain && adminDomains.includes(emailDomain)) {
      console.log(`✅ Domain match: ${email} (domain: ${emailDomain})`);
      return true;
    }

    // Check pattern matches
    if (adminPatterns.some(pattern => emailLower.includes(pattern))) {
      console.log(`✅ Pattern match: ${email} (contains: ${adminPatterns.find(p => emailLower.includes(p))})`);
      return true;
    }

    console.log(`❌ No match: ${email}`);
    return false;
  }

  // Test various email addresses
  const testEmails = [
    'admin@temple.com',
    'admin@yourdomain.com',
    'user@temple.com',
    'manager@company.com',
    'superadmin@temple.com',
    'admin@other.com',
    'user@other.com',
    'test@temple.com'
  ];

  console.log('🧪 Testing Email Detection:');
  testEmails.forEach(email => {
    console.log(`\nTesting: ${email}`);
    const isAdmin = isAdminEmail(email);
    console.log(`Result: ${isAdmin ? 'ADMIN' : 'NOT ADMIN'}`);
  });

  console.log('\n🎯 Summary:');
  console.log('If admin@temple.com is not detected as admin, there might be an issue with:');
  console.log('1. Environment variable loading');
  console.log('2. Case sensitivity');
  console.log('3. Whitespace in configuration');
  console.log('4. Module import issues');
}

testAdminDetection();
