
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  isAutoBackupEnabled, 
  getBackupInterval, 
  startAutoBackup,
  isServerBackupEnabled,
  getLastBackupDate,
  getServerBackupUrl,
  initializeBackupSystem
} from '@/utils/autoBackup';

export const useBackupMonitor = () => {
  const [isBackupRunning, setIsBackupRunning] = useState(isAutoBackupEnabled());
  const [isServerEnabled, setIsServerEnabled] = useState(isServerBackupEnabled());
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(getLastBackupDate());
  const [backupInterval, setBackupInterval] = useState(getBackupInterval());
  const [serverUrl, setServerUrl] = useState(getServerBackupUrl());
  const { toast } = useToast();
  
  // Initialize backup system on first load
  useEffect(() => {
    initializeBackupSystem();
  }, []);
  
  // Monitor backup status
  useEffect(() => {
    // Check backup status initially
    setIsBackupRunning(isAutoBackupEnabled());
    setIsServerEnabled(isServerBackupEnabled());
    setLastBackupTime(getLastBackupDate());
    setBackupInterval(getBackupInterval());
    setServerUrl(getServerBackupUrl());
    
    // Set up polling to check if backup status has changed
    const intervalId = setInterval(() => {
      const currentBackupRunning = isAutoBackupEnabled();
      const currentServerEnabled = isServerBackupEnabled();
      const currentLastBackup = getLastBackupDate();
      const currentServerUrl = getServerBackupUrl();
      
      if (currentBackupRunning !== isBackupRunning) {
        setIsBackupRunning(currentBackupRunning);
      }
      
      if (currentServerEnabled !== isServerEnabled) {
        setIsServerEnabled(currentServerEnabled);
      }

      if (currentServerUrl !== serverUrl) {
        setServerUrl(currentServerUrl);
      }
      
      if (currentLastBackup !== lastBackupTime) {
        setLastBackupTime(currentLastBackup);
        // Show toast when a new backup is created
        toast({
          title: "Respaldo completado",
          description: `Se ha creado un nuevo respaldo a las ${new Date(currentLastBackup || '').toLocaleTimeString()}`,
        });
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [isBackupRunning, isServerEnabled, lastBackupTime, toast, serverUrl]);
  
  // Ensure backup is running if server backup is enabled
  useEffect(() => {
    if (isServerEnabled && !isBackupRunning) {
      // Start auto backup if server backup is enabled but auto backup isn't running
      startAutoBackup(backupInterval);
      setIsBackupRunning(true);
      
      toast({
        title: "Respaldos automáticos iniciados",
        description: `Se ha iniciado el respaldo automático cada ${backupInterval} minutos para el envío al servidor.`,
      });
    }
  }, [isServerEnabled, isBackupRunning, backupInterval, toast]);
  
  return {
    isBackupRunning,
    isServerEnabled,
    lastBackupTime,
    backupInterval,
    serverUrl,
  };
};
