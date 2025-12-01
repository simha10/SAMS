import { useState, useEffect } from 'react';
import { updateSW } from '@/service-worker';

export function usePWA() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // Check if app is installed (standalone mode)
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true);

        // Listen for online/offline events
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowInstallPrompt(false);
        }

        setDeferredPrompt(null);
    };

    const updateApp = () => {
        updateSW(true);
    };

    return {
        isOnline,
        isStandalone,
        showInstallPrompt,
        installApp,
        updateApp
    };
}