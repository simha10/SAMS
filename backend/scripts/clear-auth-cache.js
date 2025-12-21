#!/usr/bin/env node

/**
 * Script to clear all authentication cache and session data
 * This should be run when deploying updates that might cause authentication conflicts
 */

console.log('=== CLEARING AUTHENTICATION CACHE ===');

// Clear localStorage
try {
  localStorage.clear();
  console.log('✓ LocalStorage cleared');
} catch (error) {
  console.log('⚠ LocalStorage clear failed:', error.message);
}

// Clear sessionStorage
try {
  sessionStorage.clear();
  console.log('✓ SessionStorage cleared');
} catch (error) {
  console.log('⚠ SessionStorage clear failed:', error.message);
}

// Clear all cookies
try {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }
  console.log('✓ Cookies cleared');
} catch (error) {
  console.log('⚠ Cookie clear failed:', error.message);
}

// Clear service worker caches
if ('serviceWorker' in navigator && 'caches' in window) {
  caches.keys().then(function(cacheNames) {
    return Promise.all(
      cacheNames.map(function(cacheName) {
        console.log('✓ Cache cleared:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(function() {
    console.log('✓ All caches cleared');
  }).catch(function(error) {
    console.log('⚠ Cache clear failed:', error.message);
  });
}

console.log('=== AUTHENTICATION CACHE CLEAR COMPLETE ===');