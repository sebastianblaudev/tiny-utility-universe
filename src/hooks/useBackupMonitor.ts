
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  
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
        // Show toast when a new backup is created (but only for timestamp backups)
        toast({
          title: "Respaldo completado",
          description: `Se han creado respaldos nuevos: uno con fecha y hora, y uno con nombre fijo para sincronización`,
        });
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [isBackupRunning, lastBackupTime, toast]);
  
  return {
    isBackupRunning,
    lastBackupTime,
    backupInterval,
  };
};
