// Clear Clerk handshake stuck state
// Run this in browser console if you get stuck on handshake URL

// Clear session storage
sessionStorage.removeItem('clerk_handshake_start');

// Clear any handshake parameters from URL
const url = new URL(window.location);
url.searchParams.delete('__clerk_handshake');
window.history.replaceState({}, document.title, url.pathname);

// Reload the page
window.location.reload();

console.log('Handshake state cleared and page reloaded');
