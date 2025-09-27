// Test admin detection in browser context
console.log('🔍 Testing Admin Detection in Browser Context');
console.log('==============================================');

// Check if we're in browser or Node.js
const isBrowser = typeof window !== 'undefined';
console.log('Environment:', isBrowser ? 'Browser' : 'Node.js');

// Check environment variables
if (isBrowser) {
  console.log('📋 Browser Environment Variables:');
  console.log('import.meta.env.VITE_ADMIN_EMAILS:', import.meta?.env?.VITE_ADMIN_EMAILS);
  console.log('import.meta.env.VITE_ADMIN_DOMAINS:', import.meta?.env?.VITE_ADMIN_DOMAINS);
  console.log('import.meta.env.VITE_ADMIN_PATTERNS:', import.meta?.env?.VITE_ADMIN_PATTERNS);
  console.log('import.meta.env.VITE_SUPER_ADMIN_EMAILS:', import.meta?.env?.VITE_SUPER_ADMIN_EMAILS);
} else {
  console.log('📋 Node.js Environment Variables:');
  console.log('process.env.VITE_ADMIN_EMAILS:', process.env.VITE_ADMIN_EMAILS);
  console.log('process.env.VITE_ADMIN_DOMAINS:', process.env.VITE_ADMIN_DOMAINS);
  console.log('process.env.VITE_ADMIN_PATTERNS:', process.env.VITE_ADMIN_PATTERNS);
  console.log('process.env.VITE_SUPER_ADMIN_EMAILS:', process.env.VITE_SUPER_ADMIN_EMAILS);
}

// Test admin detection
try {
  const { isAdminEmail, getAdminRole, getAdminStatus, getAdminApproval } = await import('./src/config/adminConfig.ts');
  
  console.log('\\n✅ adminConfig.ts imported successfully');
  
  // Test the functions
  const testEmails = [
    'admin@temple.com',
    'user@temple.com',
    'manager@company.com',
    'admin@other.com'
  ];
  
  console.log('\\n🧪 Testing Admin Detection:');
  testEmails.forEach(email => {
    console.log(`\\nTesting: ${email}`);
    console.log(`isAdminEmail: ${isAdminEmail(email)}`);
    console.log(`getAdminRole: ${getAdminRole(email)}`);
    console.log(`getAdminStatus: ${getAdminStatus(email)}`);
    console.log(`getAdminApproval: ${getAdminApproval(email)}`);
  });
  
} catch (error) {
  console.error('❌ Error importing adminConfig.ts:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\\n🎯 If admin detection is not working:');
console.log('1. Check if environment variables are set in Vercel');
console.log('2. Check if VITE_ prefix is correct');
console.log('3. Check browser console for errors');
console.log('4. Try restarting the development server');
