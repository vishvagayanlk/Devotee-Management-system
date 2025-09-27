// Clear all caches and force fresh start
// Run this in browser console

console.log('Clearing all caches...');

// Clear all storage
localStorage.clear();
sessionStorage.clear();

// Clear any Clerk-related storage
Object.keys(localStorage).forEach(key => {
  if (key.includes('clerk') || key.includes('__clerk')) {
    localStorage.removeItem(key);
  }
});

Object.keys(sessionStorage).forEach(key => {
  if (key.includes('clerk') || key.includes('__clerk')) {
    sessionStorage.removeItem(key);
  }
});

// Clear URL parameters
const url = new URL(window.location);
url.searchParams.delete('__clerk_handshake');
url.searchParams.delete('__clerk_db_jwt');
url.searchParams.delete('__clerk_handshake_token');
url.searchParams.delete('__clerk_handshake');
window.history.replaceState({}, document.title, url.pathname);

// Force reload
console.log('All caches cleared, reloading...');
window.location.reload();
