/// <reference types="vite-plugin-pwa/client" />

import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
        console.log('New content is available, please refresh.')
        // Show a prompt to the user to update the app
        if (confirm('New version available. Refresh to update?')) {
            updateSW(true)
        }
    },
    onOfflineReady() {
        console.log('App is ready for offline use.')
        // Show a toast or notification that the app is ready for offline use
    },
    onRegistered(swRegistration) {
        console.log('Service Worker registered:', swRegistration)
        if (swRegistration) {
            swRegistration.update();
        }
    },
    onRegisterError(error) {
        console.error('Service Worker registration error:', error)
    }
})

// Export the update function for manual updates
export { updateSW }