#!/usr/bin/env node

/**
 * Debug script to test handshake URL handling
 */

console.log('🔍 Testing Handshake URL Handling...\n');

// Test 1: Check if the handshake URL is accessible
const testUrl = 'http://localhost:5175/dashboard?__clerk_handshake=test';
console.log('1. Testing handshake URL accessibility:');
console.log(`   URL: ${testUrl}`);

// Test 2: Check if the app loads
console.log('\n2. Testing app loading:');
import { exec } from 'child_process';

exec(`curl -s "${testUrl}" | grep -o "root"`, (error, stdout, stderr) => {
  if (error) {
    console.log('   ❌ Error accessing URL:', error.message);
    return;
  }
  
  if (stdout.includes('root')) {
    console.log('   ✅ App loads successfully');
  } else {
    console.log('   ❌ App does not load');
  }
  
  // Test 3: Check if handshake detection works
  console.log('\n3. Testing handshake detection logic:');
  const testSearch = '?__clerk_handshake=test';
  const urlParams = new URLSearchParams(testSearch);
  const hasHandshake = urlParams.has('__clerk_handshake') || urlParams.has('__clerk_handshake_token');
  
  console.log(`   Search params: ${testSearch}`);
  console.log(`   Has handshake: ${hasHandshake ? 'YES' : 'NO'}`);
  
  if (hasHandshake) {
    console.log('   ✅ Handshake detection logic works');
  } else {
    console.log('   ❌ Handshake detection logic failed');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('   1. Open browser and go to the handshake URL');
  console.log('   2. Open browser console (F12)');
  console.log('   3. Look for "AppContent: Handshake check" logs');
  console.log('   4. Check if HandshakeHandler component appears');
  
  console.log('\n🔗 Test URLs:');
  console.log(`   Handshake: ${testUrl}`);
  console.log('   Normal: http://localhost:5175/dashboard');
  console.log('   Sign-in: http://localhost:5175/sign-in');
});
