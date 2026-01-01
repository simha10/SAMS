import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';
import { useNetwork } from '@/contexts/NetworkContext';
import { useAuthStore } from '@/stores/authStore';

const OfflineIndicator: React.FC = () => {
  const { isOnline, isOfflineAuthenticated } = useNetwork();
  const { user } = useAuthStore();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Show indicator only when offline and user is authenticated
    if (!isOnline && user && (isOfflineAuthenticated || user)) {
      setShowIndicator(true);
    } else {
      setShowIndicator(false);
    }
  }, [isOnline, user, isOfflineAuthenticated]);

  if (!showIndicator) {
    return null;
  }

  return (
    <Alert className="bg-yellow-100 border-yellow-300 text-yellow-800 rounded-none">
      <div className="flex items-center">
        <WifiOff className="h-4 w-4 mr-2" />
        <AlertDescription className="text-center flex-1">
          No internet connection. Showing last available data. Some features may not work.
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default OfflineIndicator;