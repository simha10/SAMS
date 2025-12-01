// Simple test to verify PWA functionality
console.log('PWA Test File Loaded');

// Check if service worker is supported
if ('serviceWorker' in navigator) {
    console.log('Service Worker is supported');

    // Register service worker
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
} else {
    console.log('Service Worker is not supported');
}

// Check if app is installed
const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

console.log('App is installed (standalone mode):', isStandalone);

// Check online status
console.log('Online status:', navigator.onLine);

// Export for testing
export { isStandalone };