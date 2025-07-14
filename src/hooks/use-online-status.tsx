
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  // Initialize with the browser's online status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(navigator.onLine ? new Date() : null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineTime(new Date());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    // Additional heartbeat check to detect network interruptions
    // that the browser might not immediately detect
    const checkNetworkStatus = async () => {
      try {
        // Use a very small image to check if we can reach the server
        const response = await fetch('/favicon.ico', { 
          method: 'HEAD',
          // Use cache-busting query param to avoid getting cached responses
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok && !isOnline) {
          handleOnline();
        }
      } catch (error) {
        if (isOnline) {
          handleOffline();
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check network status every minute
    const intervalId = setInterval(checkNetworkStatus, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);

  return {
    isOnline,
    lastOnlineTime
  };
}
