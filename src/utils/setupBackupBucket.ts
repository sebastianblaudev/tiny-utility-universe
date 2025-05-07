
/**
 * Utilidades para configurar el bucket de respaldo en Supabase
 */

import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/lib/auth";

/**
 * Configura el bucket de respaldos en Supabase
 */
export const setupBackupBucket = async (): Promise<boolean> => {
  try {
    // Verificar si el usuario está autenticado
    const auth = Auth.getInstance();
    if (!auth.isAuthenticated() || !auth.currentUser?.id) {
      console.error('User not authenticated');
      return false;
    }
    
    // Verificar si el bucket ya existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError);
      return false;
    }
    
    // Si el bucket ya existe, no hacer nada
    if (buckets.some(bucket => bucket.name === 'user_backups')) {
      console.log('Backup bucket already exists');
      return true;
    }
    
    // Intentar crear el bucket (requiere permisos de administrador)
    const { error } = await supabase.storage.createBucket('user_backups', {
      public: false
    });
    
    if (error) {
      console.error('Error creating backup bucket:', error);
      
      // Si no se puede crear, intentar invocar una función Edge
      return await invokeBucketSetupFunction();
    }
    
    console.log('Backup bucket created successfully');
    return true;
  } catch (error) {
    console.error('Error setting up backup bucket:', error);
    return false;
  }
};

/**
 * Invoca la función Edge para configurar el bucket de respaldos
 */
export const invokeBucketSetupFunction = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('setup_backup_bucket', {
      body: { action: 'create' }
    });
    
    if (error) {
      console.error('Error invoking setup_backup_bucket function:', error);
      return false;
    }
    
    return data?.success || false;
  } catch (error) {
    console.error('Error invoking edge function:', error);
    return false;
  }
};
