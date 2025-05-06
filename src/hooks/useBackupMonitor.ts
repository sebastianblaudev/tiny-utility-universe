
import { useState, useEffect } from 'react';
import { 
  isAutoBackupEnabled, 
  getBackupInterval, 
  startAutoBackup,
  getLastBackupDate
} from '@/utils/autoBackup';

export const useBackupMonitor = () => {
  const [isBackupRunning, setIsBackupRunning] = useState(isAutoBackupEnabled());
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(getLastBackupDate());
  const [backupInterval, setBackupInterval] = useState(getBackupInterval());
  
  // Monitor backup status
  useEffect(() => {
    // Check backup status initially
    setIsBackupRunning(isAutoBackupEnabled());
    setLastBackupTime(getLastBackupDate());
    setBackupInterval(getBackupInterval());
    
    // Set up polling to check if backup status has changed
    const intervalId = setInterval(() => {
      const currentBackupRunning = isAutoBackupEnabled();
      const currentLastBackup = getLastBackupDate();
      
      if (currentBackupRunning !== isBackupRunning) {
        setIsBackupRunning(currentBackupRunning);
      }
      
      if (currentLastBackup !== lastBackupTime) {
        setLastBackupTime(currentLastBackup);
        // No toast notification here
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [isBackupRunning, lastBackupTime]);
  
  return {
    isBackupRunning,
    lastBackupTime,
    backupInterval,
  };
};
