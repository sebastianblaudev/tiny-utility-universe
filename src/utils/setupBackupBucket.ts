
import { supabase } from "@/integrations/supabase/client";
import { Auth } from '@/lib/auth';

export async function setupBackupBucket(): Promise<boolean> {
  try {
    const auth = Auth.getInstance();
    if (!auth.isAuthenticated()) {
      console.log('User not authenticated, cannot setup backup bucket');
      return false;
    }

    // Test if the bucket exists by listing buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking buckets:', error);
      return false;
    }
    
    // Check if the user_backups bucket exists
    const bucketExists = buckets.some(bucket => bucket.name === 'user_backups');
    
    if (!bucketExists) {
      console.log('Backup bucket does not exist, trying to create it via edge function');
      return false;
    }

    // Check if the user's folder exists in the bucket
    if (auth.currentUser?.id) {
      // Try to list files in the user's folder to check if it exists
      const { data: userFiles, error: userFolderError } = await supabase.storage
        .from('user_backups')
        .list(auth.currentUser.id);
        
      if (userFolderError && userFolderError.message !== 'The resource was not found') {
        console.error('Error checking user folder:', userFolderError);
        // Continue anyway as we'll create the folder if needed when uploading
      }
    }

    // Initialize local backup config if not exists
    const localBackupConfig = localStorage.getItem('backup_config') || JSON.stringify({
      autoBackupEnabled: false,
      backupInterval: 5,
      backupPath: '',
      lastBackupDate: null,
      cloudEnabled: true,
      autoCloudBackup: true,
      supabaseEnabled: true
    });
    
    localStorage.setItem('backup_config', localBackupConfig);
    
    console.log('Configuración de respaldos inicializada correctamente');
    
    return true;
  } catch (error) {
    console.error('Error in setupBackupBucket:', error);
    return false;
  }
}

// Create an Edge Function to setup the backup bucket
export async function invokeBucketSetupFunction(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('setup_backup_bucket', {
      body: { action: 'setup' }
    });

    if (error) {
      console.error('Error invoking setup_backup_bucket function:', error);
      return false;
    }

    if (data && data.success) {
      console.log('Backup bucket setup successful:', data.message);
      return true;
    } else {
      console.log('Backup bucket setup failed:', data?.message);
      return false;
    }
  } catch (error) {
    console.error('Error invoking setup_backup_bucket function:', error);
    return false;
  }
}
