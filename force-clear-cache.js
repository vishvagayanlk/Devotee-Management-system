// Force clear all caches and reload
// Run this in browser console

console.log('Force clearing all caches...');

// Clear all storage
try {
  localStorage.clear();
  sessionStorage.clear();
  console.log('✓ Cleared localStorage and sessionStorage');
} catch (e) {
  console.log('✗ Error clearing storage:', e);
}

// Clear specific Clerk-related items
const clerkKeys = [];
Object.keys(localStorage).forEach(key => {
  if (key.includes('clerk') || key.includes('__clerk') || key.includes('clerk-')) {
    clerkKeys.push(key);
    localStorage.removeItem(key);
  }
});

Object.keys(sessionStorage).forEach(key => {
  if (key.includes('clerk') || key.includes('__clerk') || key.includes('clerk-')) {
    clerkKeys.push(key);
    sessionStorage.removeItem(key);
  }
});

console.log('✓ Cleared Clerk keys:', clerkKeys);

// Clear URL parameters
const url = new URL(window.location);
const originalUrl = url.href;
url.searchParams.delete('__clerk_handshake');
url.searchParams.delete('__clerk_db_jwt');
url.searchParams.delete('__clerk_handshake_token');
url.searchParams.delete('__clerk_handshake');
url.searchParams.delete('__clerk_handshake_token');
url.searchParams.delete('__clerk_handshake');

if (url.href !== originalUrl) {
  window.history.replaceState({}, document.title, url.pathname);
  console.log('✓ Cleared URL parameters');
}

// Clear any service worker caches
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName);
    });
    console.log('✓ Cleared service worker caches');
  });
}

// Force reload with cache bypass
console.log('✓ Force reloading with cache bypass...');
window.location.reload(true);
