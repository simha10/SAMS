/// <reference types="vite-plugin-pwa/client" />

import { registerSW } from 'virtual:pwa-register'

// Clear caches only when necessary (not on every registration)
const clearAllCaches = async () => {
  if (import.meta.env.DEV) {
    return; // Never clear in development
  }
  
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      // Only clear old caches, not current ones
      const currentCacheVersion = 'v1';
      await Promise.all(
        cacheNames
          .filter(name => !name.includes(currentCacheVersion))
          .map(name => caches.delete(name))
      );
      console.log('Old caches cleared successfully');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }
};

// Development version - minimal service worker
const devUpdateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available (dev mode)');
    // In development, don't force refresh
  },
  onOfflineReady() {
    console.log('App ready for offline use (dev mode)');
  },
  onRegistered(swRegistration) {
    console.log('Service Worker registered (dev mode):', swRegistration);
  },
  onRegisterError(error) {
    console.error('Service Worker registration error (dev mode):', error);
  }
});

// Production version - controlled updates
const prodUpdateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content is available');
    // Don't auto-refresh, let user decide
    if (window.confirm('New version available. Refresh to update?')) {
      clearAllCaches().then(() => {
        prodUpdateSW(true);
      });
    }
  },
  onOfflineReady() {
    console.log('App is ready for offline use.');
  },
  onRegistered(swRegistration) {
    console.log('Service Worker registered:', swRegistration);
    // Don't clear caches on registration, only on update
    if (swRegistration) {
      swRegistration.update();
    }
  },
  onRegisterError(error) {
    console.error('Service Worker registration error:', error);
  }
});

const updateSW = import.meta.env.DEV ? devUpdateSW : prodUpdateSW;

export { updateSW }