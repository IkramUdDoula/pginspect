import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-12 left-0 right-0 z-50">
      <div className="bg-yellow-500/90 text-yellow-950 px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="h-4 w-4" />
          <span>You are currently offline. Some features may be unavailable.</span>
        </div>
      </div>
    </div>
  );
}
