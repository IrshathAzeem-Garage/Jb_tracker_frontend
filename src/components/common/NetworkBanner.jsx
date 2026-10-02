import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../utils/useOnlineStatus';

export const NetworkBanner = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 shadow-md pt-safe">
      <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
      <span>You're offline. Financial transactions require an active internet connection.</span>
    </div>
  );
};

export default NetworkBanner;
