
/**
 * Sistema de respaldos automáticos
 */

import { openDB } from 'idb';
import { DB_NAME } from '@/lib/query-client';
import { Auth } from '@/lib/auth';
import type { BackupConfig, BackupData } from '../types/backupTypes';
import { supabase } from '@/integrations/supabase/client';
import { saveBackupToDrive, isGoogleDriveAuthenticated, initializeGoogleDrive } from './googleDrivePersonal';

// Intervalo mínimo entre backups en minutos
const MIN_BACKUP_INTERVAL = 10;

// Intervalo para verificar si es necesario hacer un backup en milisegundos
const CHECK_INTERVAL = 60000; // 1 minuto

// Variable para rastrear el temporizador activo
let activeTimer: number | undefined;

/**
 * Inicializa el sistema de respaldos automáticos
 */
export const initializeBackupSystem = async (): Promise<void> => {
  try {
    console.log('Initializing automatic backup system');
    
    // Cargar configuración de respaldo
    const config = await loadBackupConfig();
    
    // Si los respaldos están habilitados, iniciar el temporizador
    if (config?.enabled) {
      startBackupTimer(config);
    } else {
      console.log('Automatic backups are disabled');
    }
    
    // Inicializar Google Drive si está configurado para respaldos en la nube
    if (config?.cloudEnabled) {
      try {
        await initializeGoogleDrive();
      } catch (error) {
        console.error('Error initializing Google Drive:', error);
      }
    }
  } catch (error) {
    console.error('Error initializing backup system:', error);
  }
};

/**
 * Inicia el temporizador para respaldos automáticos
 */
const startBackupTimer = (config: BackupConfig): void => {
  // Limpiar temporizador existente si hay uno
  if (activeTimer) {
    window.clearInterval(activeTimer);
  }
  
  console.log(`Starting backup timer with interval: ${config.interval} minutes`);
  
  // Convertir intervalo a milisegundos
  const intervalMs = Math.max(MIN_BACKUP_INTERVAL, config.interval) * 60 * 1000;
  
  // Establecer intervalo para verificar si es hora de hacer un respaldo
  activeTimer = window.setInterval(async () => {
    try {
      // Verificar si es hora de hacer un respaldo
      const shouldBackup = await checkIfBackupNeeded(config);
      
      if (shouldBackup) {
        console.log('Starting automatic backup');
        await createAutomaticBackup();
      }
    } catch (error) {
      console.error('Error in backup timer:', error);
    }
  }, CHECK_INTERVAL);
};

/**
 * Verifica si es necesario hacer un respaldo según la configuración
 */
const checkIfBackupNeeded = async (config: BackupConfig): Promise<boolean> => {
  // Si los respaldos están deshabilitados, no hacer nada
  if (!config.enabled) return false;
  
  // Si no hay fecha del último respaldo, hacer uno ahora
  if (!config.lastBackupDate) return true;
  
  // Calcular tiempo desde el último respaldo
  const lastBackup = new Date(config.lastBackupDate);
  const now = new Date();
  const diffMs = now.getTime() - lastBackup.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  // Verificar si ha pasado suficiente tiempo
  return diffMinutes >= config.interval;
};

/**
 * Carga la configuración de respaldo desde IndexedDB
 */
const loadBackupConfig = async (): Promise<BackupConfig | null> => {
  try {
    const db = await openDB(DB_NAME, 9);
    
    // Intentar cargar configuración existente
    let config = await db.get('settings', 'backup_config') as BackupConfig | undefined;
    
    // Si no existe, crear configuración predeterminada
    if (!config) {
      config = {
        enabled: false,
        interval: 60, // 1 hora
        cloudEnabled: false,
      };
      
      // Guardar configuración predeterminada
      await db.put('settings', config, 'backup_config');
    }
    
    return config;
  } catch (error) {
    console.error('Error loading backup config:', error);
    return null;
  }
};

/**
 * Actualiza la configuración de respaldo
 */
export const updateBackupConfig = async (config: Partial<BackupConfig>): Promise<boolean> => {
  try {
    const db = await openDB(DB_NAME, 9);
    
    // Cargar configuración existente
    const existingConfig = await db.get('settings', 'backup_config') as BackupConfig | undefined;
    
    // Fusionar configuración existente con nuevos valores
    const updatedConfig: BackupConfig = {
      ...existingConfig || {
        enabled: false,
        interval: 60,
        cloudEnabled: false,
      },
      ...config,
    };
    
    // Guardar configuración actualizada
    await db.put('settings', updatedConfig, 'backup_config');
    
    // Si se habilitaron los respaldos, iniciar temporizador
    if (updatedConfig.enabled) {
      startBackupTimer(updatedConfig);
    } else if (activeTimer) {
      // Si se deshabilitaron, detener temporizador
      window.clearInterval(activeTimer);
      activeTimer = undefined;
    }
    
    // Si se habilitaron los respaldos en la nube, inicializar Google Drive
    if (updatedConfig.cloudEnabled && !isGoogleDriveAuthenticated()) {
      try {
        await initializeGoogleDrive();
      } catch (error) {
        console.error('Error initializing Google Drive:', error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating backup config:', error);
    return false;
  }
};

/**
 * Crea un respaldo automático
 */
const createAutomaticBackup = async (): Promise<boolean> => {
  try {
    console.log('Creating automatic backup');
    
    // Verificar autenticación
    const auth = Auth.getInstance();
    if (!auth.isAuthenticated() || !auth.currentUser?.id) {
      console.error('User not authenticated for automatic backup');
      return false;
    }
    
    const userId = auth.currentUser.id;
    
    // Abrir la base de datos
    const db = await openDB(DB_NAME, 9);
    
    // Obtener datos para el respaldo
    const products = await db.getAll('products');
    const customers = await db.getAll('customers');
    const orders = await db.getAll('orders');
    const tables = await db.getAll('tables');
    
    // Obtener datos de negocio
    const business = await db.get('business', 1);
    
    // Crear objeto de datos del respaldo
    const backupData: BackupData = {
      products,
      customers,
      orders,
      tables,
      business,
      timestamp: new Date().toISOString(),
    };
    
    // Guardar respaldo localmente
    await saveLocalBackup(backupData);
    
    // Cargar configuración
    const config = await loadBackupConfig();
    
    // Si el respaldo en la nube está habilitado, intentarlo
    if (config?.cloudEnabled) {
      try {
        if (isGoogleDriveAuthenticated()) {
          // Subir a Google Drive
          console.log('Uploading backup to Google Drive');
          const driveResult = await saveBackupToDrive(backupData);
          
          if (driveResult.success) {
            console.log('Backup uploaded to Google Drive successfully', driveResult.link);
          } else {
            console.error('Error uploading to Google Drive:', driveResult.error);
          }
        } else {
          console.log('Google Drive not authenticated, skipping cloud backup');
        }
      } catch (error) {
        console.error('Error with cloud backup:', error);
      }
    }
    
    // Sincronizar con Supabase si está habilitado
    if (config?.cloudEnabled && isSupabaseBackupEnabled()) {
      try {
        await saveSupabaseBackup(backupData);
      } catch (error) {
        console.error('Error with Supabase backup:', error);
      }
    }
    
    // Actualizar fecha del último respaldo
    await updateBackupConfig({
      lastBackupDate: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error creating automatic backup:', error);
    return false;
  }
};

/**
 * Guarda un respaldo localmente
 */
const saveLocalBackup = async (data: BackupData): Promise<boolean> => {
  try {
    // Crear blob y URL para el archivo
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Crear timestamp para el nombre del archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Crear enlace temporal y simular clic para descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = `pizzapos-backup-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Liberar URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    return true;
  } catch (error) {
    console.error('Error saving local backup:', error);
    return false;
  }
};

/**
 * Guarda un respaldo en Supabase
 */
const saveSupabaseBackup = async (data: BackupData): Promise<boolean> => {
  try {
    const auth = Auth.getInstance();
    if (!auth.isAuthenticated() || !auth.currentUser?.id) {
      console.error('User not authenticated for Supabase backup');
      return false;
    }
    
    const userId = auth.currentUser.id;
    
    // Crear blob con los datos
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    
    // Crear timestamp para el nombre del archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `pizzapos-backup-${timestamp}.json`;
    
    // Subir a Supabase Storage
    const { data: uploadData, error } = await supabase.storage
      .from('user_backups')
      .upload(`${userId}/${filename}`, blob, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error with Supabase backup:', error);
    return false;
  }
};

// Funciones exportadas que faltan
export const startAutoBackup = async (intervalMinutes: number): Promise<boolean> => {
  try {
    const config: Partial<BackupConfig> = {
      enabled: true,
      interval: intervalMinutes
    };
    
    const success = await updateBackupConfig(config);
    return success;
  } catch (error) {
    console.error('Error starting auto backup:', error);
    return false;
  }
};

export const stopAutoBackup = async (): Promise<boolean> => {
  try {
    if (activeTimer) {
      window.clearInterval(activeTimer);
      activeTimer = undefined;
    }
    
    const config: Partial<BackupConfig> = {
      enabled: false
    };
    
    const success = await updateBackupConfig(config);
    return success;
  } catch (error) {
    console.error('Error stopping auto backup:', error);
    return false;
  }
};

export const isAutoBackupEnabled = (): boolean => {
  return activeTimer !== undefined;
};

export const getBackupInterval = (): number => {
  // Valor por defecto, idealmente debería recuperarse de la configuración
  return 60;
};

export const getLastBackupDate = (): string | null => {
  return localStorage.getItem('lastBackupDate');
};

export const createBackup = async (): Promise<string | null> => {
  try {
    await createAutomaticBackup();
    const timestamp = new Date().toISOString();
    localStorage.setItem('lastBackupDate', timestamp);
    return `backup-${timestamp}.json`;
  } catch (error) {
    console.error('Error creating backup:', error);
    return null;
  }
};

export const selectBackupDirectory = async (): Promise<boolean> => {
  try {
    // Esta función podría implementarse con la API de File System Access
    // Por ahora es un placeholder
    return true;
  } catch (error) {
    console.error('Error selecting backup directory:', error);
    return false;
  }
};

export const restoreFromLocalBackup = async (file: File): Promise<boolean> => {
  try {
    const fileContent = await file.text();
    const backupData = JSON.parse(fileContent) as BackupData;
    
    // Aquí iría el código para restaurar los datos desde el respaldo
    console.log('Restoring data from backup:', backupData);
    
    return true;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    return false;
  }
};

export const setCloudConfig = (config: any): boolean => {
  try {
    localStorage.setItem('cloudConfig', JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error setting cloud config:', error);
    return false;
  }
};

export const testGoogleCloudConnection = async (): Promise<boolean> => {
  // Implementación temporal
  return isGoogleDriveAuthenticated();
};

export const isCloudEnabled = (): boolean => {
  try {
    const config = localStorage.getItem('cloudConfig');
    if (!config) return false;
    const parsedConfig = JSON.parse(config);
    return parsedConfig.cloudEnabled === true;
  } catch {
    return false;
  }
};

export const getCloudBucketName = (): string => {
  try {
    const config = localStorage.getItem('cloudConfig');
    if (!config) return '';
    const parsedConfig = JSON.parse(config);
    return parsedConfig.cloudBucketName || '';
  } catch {
    return '';
  }
};

export const isAutoCloudBackupEnabled = (): boolean => {
  try {
    const value = localStorage.getItem('autoCloudBackup');
    return value === 'true';
  } catch {
    return false;
  }
};

export const setAutoCloudBackup = (enabled: boolean): boolean => {
  try {
    localStorage.setItem('autoCloudBackup', String(enabled));
    return true;
  } catch {
    return false;
  }
};

export const isSupabaseBackupEnabled = (): boolean => {
  try {
    const value = localStorage.getItem('supabaseBackupEnabled');
    return value === 'true';
  } catch {
    return false;
  }
};

export const setSupabaseBackupEnabled = (enabled: boolean): boolean => {
  try {
    localStorage.setItem('supabaseBackupEnabled', String(enabled));
    return true;
  } catch {
    return false;
  }
};

export const testSupabaseStorageConnection = async (): Promise<{success: boolean, message: string}> => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return {
        success: false,
        message: `Error al conectar con Supabase: ${error.message}`
      };
    }
    
    return {
      success: true,
      message: `Conexión exitosa. ${data.length} buckets disponibles.`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
};

export const listCloudBackups = async (): Promise<{name: string; path: string; updated_at: string}[]> => {
  try {
    const auth = Auth.getInstance();
    if (!auth.isAuthenticated() || !auth.currentUser?.id) {
      throw new Error('Usuario no autenticado');
    }
    
    const { data, error } = await supabase.storage
      .from('user_backups')
      .list(auth.currentUser.id);
      
    if (error) {
      console.error('Error listing backups:', error);
      return [];
    }
    
    return data
      .filter(file => file.name.endsWith('.json'))
      .map(file => ({
        name: file.name,
        path: `${auth.currentUser?.id}/${file.name}`,
        updated_at: file.updated_at || file.created_at
      }));
  } catch (error) {
    console.error('Error listing cloud backups:', error);
    return [];
  }
};

export const restoreFromCloudBackup = async (path: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage
      .from('user_backups')
      .download(path);
      
    if (error || !data) {
      console.error('Error downloading backup:', error);
      return false;
    }
    
    const fileContent = await data.text();
    const backupData = JSON.parse(fileContent) as BackupData;
    
    // Aquí iría el código para restaurar los datos desde el respaldo
    console.log('Restoring data from cloud backup:', backupData);
    
    return true;
  } catch (error) {
    console.error('Error restoring from cloud backup:', error);
    return false;
  }
};
