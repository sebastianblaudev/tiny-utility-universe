
import { useState, useEffect } from 'react';
import { Auth } from '@/lib/auth';
import { supabase } from "@/integrations/supabase/client";

export function useBackupMonitor() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [backupsCount, setBackupsCount] = useState(0);

  useEffect(() => {
    // Check initial connection state
    checkConnectionState();
    
    // Setup interval to check connection periodically
    const interval = setInterval(checkConnectionState, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  const checkConnectionState = async () => {
    const auth = Auth.getInstance();
    
    // First check if user is authenticated
    if (!auth.isAuthenticated() || !auth.currentUser?.id) {
      setIsConnected(false);
      return;
    }
    
    try {
      // Try to list buckets to check connection
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error checking Supabase buckets:', error);
        setIsConnected(false);
        return;
      }
      
      // Check if the user_backups bucket exists
      const bucketExists = buckets.some(bucket => bucket.name === 'user_backups');
      setIsConnected(bucketExists);
      
      if (bucketExists) {
        // Count user's backups
        const { data: files, error: listError } = await supabase.storage
          .from('user_backups')
          .list(auth.currentUser.id);
          
        if (listError) {
          console.error('Error listing user backups:', listError);
          // If the folder doesn't exist yet, it's not necessarily an error
          if (listError.message === 'The resource was not found') {
            setBackupsCount(0);
          }
        } else if (files) {
          setBackupsCount(files.length);
          
          // Find the latest backup
          if (files.length > 0) {
            const latestBackup = files.reduce((latest, current) => {
              const currentDate = current.updated_at || current.created_at;
              const latestDate = latest.updated_at || latest.created_at;
              return new Date(currentDate) > new Date(latestDate) ? current : latest;
            });
            
            setLastBackupDate(latestBackup.updated_at || latestBackup.created_at);
          }
        }
      }
    } catch (error) {
      console.error('Error checking Supabase connection:', error);
      setIsConnected(false);
    }
  };

  return {
    isConnected,
    lastBackupDate,
    backupsCount,
    refresh: checkConnectionState
  };
}
