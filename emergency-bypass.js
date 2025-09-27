// Emergency bypass for stuck handshake
// Run this in browser console if you're stuck

console.log('Emergency bypass activated');

// Clear all handshake-related storage
sessionStorage.clear();
localStorage.removeItem('clerk_handshake_start');
localStorage.removeItem('onboarding_completed');
localStorage.removeItem('onboarding_completed_timestamp');

// Clean URL
const url = new URL(window.location);
url.searchParams.delete('__clerk_handshake');
url.searchParams.delete('__clerk_db_jwt');
url.searchParams.delete('__clerk_handshake_token');
window.history.replaceState({}, document.title, url.pathname);

// Force reload
console.log('Clearing storage and reloading...');
window.location.reload();
