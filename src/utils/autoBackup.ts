import { openDB } from 'idb';
import { Product, Customer, Order, Table } from '@/lib/db';
import { Auth } from '@/lib/auth';
import type { BusinessData } from '@/types/business';
import { toast } from "sonner";
import { DB_NAME } from '@/lib/query-client';
import { supabase } from "@/integrations/supabase/client";

interface FileSystemDirectoryHandle extends FileSystemHandle {
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

interface FileSystemFileHandle extends FileSystemHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: any): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

interface BackupData {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  tables: Table[];
  timestamp: string;
  tenantId: string;
  business: BusinessData | null;
}

interface BackupConfig {
  autoBackupEnabled: boolean;
  backupInterval: number; // in minutes
  backupPath: string;
  lastBackupDate: string | null;
  cloudEnabled?: boolean;
  cloudBucketName?: string;
  autoCloudBackup?: boolean; // Setting for automatic cloud backup
  supabaseEnabled?: boolean; // New setting for Supabase backup
}

// Constants for bucket names
const BACKUP_BUCKET_NAME = 'bkpid';
const SUPABASE_BACKUP_BUCKET = 'user_backups';

// Define the database version for consistency - UPDATED to match db.ts
const DB_VERSION = 9; // Updated to match the error message showing version 9

const getDefaultConfig = (): BackupConfig => ({
  autoBackupEnabled: false,
  backupInterval: 5, // 5 minutes by default
  backupPath: '',
  lastBackupDate: null,
  cloudEnabled: true, // Enable cloud backup by default
  cloudBucketName: BACKUP_BUCKET_NAME,
  autoCloudBackup: true, // Enable auto cloud backup by default
  supabaseEnabled: true  // Enable Supabase backup by default
});

const loadConfig = (): BackupConfig => {
  const savedConfig = localStorage.getItem('backup_config');
  if (savedConfig) {
    try {
      return JSON.parse(savedConfig);
    } catch (e) {
      console.error('Error parsing backup config', e);
      return getDefaultConfig();
    }
  }
  return getDefaultConfig();
};

const saveConfig = (config: BackupConfig): void => {
  localStorage.setItem('backup_config', JSON.stringify(config));
};

let currentConfig = loadConfig();
let backupInterval: number;

export async function selectBackupDirectory(): Promise<boolean> {
  if (!window.showDirectoryPicker) {
    alert('Tu navegador no es compatible con la API de Sistema de Archivos. Por favor usa Chrome o Edge.');
    return false;
  }
  
  try {
    const dirHandle = await window.showDirectoryPicker();
    (window as any)._backupDirectoryHandle = dirHandle;
    
    // Add console logs for debugging
    console.log('Directory selected:', dirHandle.name);
    
    // No toast here
    
    return true;
  } catch (error) {
    console.error('Error selecting directory:', error);
    return false;
  }
}

export async function createBackup(): Promise<string | null> {
  try {
    // Log that backup creation started
    console.log('Starting backup creation...');
    
    // Use the correct database version from the error message
    const db = await openDB(DB_NAME, DB_VERSION);
    
    const products = await db.getAll('products');
    const customers = await db.getAll('customers');
    const orders = await db.getAll('orders');
    const tables = await db.getAll('tables');

    // Try to get business data
    const businessData = await db.get('business', 1) as BusinessData | undefined;
    
    // Get auth information for fallback
    const auth = Auth.getInstance();
    const tenantId = auth.isAuthenticated() ? auth.currentUser?.id : 'anonymous';
    const userEmail = auth.isAuthenticated() ? auth.currentUser?.username : 'anonymous@pizzapos.app';
    
    // Create fallback business data if none exists
    const businessInfo = businessData || {
      id: tenantId || 'default',
      name: 'PizzaPOS',
      email: userEmail,
      isActive: true
    };

    const backupData: BackupData = {
      products,
      customers,
      orders,
      tables,
      timestamp: new Date().toISOString(),
      tenantId: tenantId || 'anonymous',
      business: businessInfo
    };

    // Generate two filenames: one with timestamp (for history) and one fixed (for syncing)
    const timestampedFilename = `pizzapos_backup_${businessInfo.name}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const syncFilename = `pizzapos_latest_backup.json`;
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    
    console.log('Backup data ready, trying to save...');
    
    // Handle local file system backup with both files
    const dirHandle = (window as any)._backupDirectoryHandle;
    if (dirHandle) {
      try {
        console.log('Directory handle found, saving files...');
        
        // Save the timestamped backup
        const fileHandle = await dirHandle.getFileHandle(timestampedFilename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(backupData, null, 2));
        await writable.close();
        
        console.log(`Saved timestamped backup to: ${timestampedFilename}`);
        
        // Save/overwrite the latest backup with fixed name
        const latestFileHandle = await dirHandle.getFileHandle(syncFilename, { create: true });
        const latestWritable = await latestFileHandle.createWritable();
        await latestWritable.write(JSON.stringify(backupData, null, 2));
        await latestWritable.close();
        
        console.log(`Saved latest backup to: ${syncFilename}`);
        
        currentConfig.lastBackupDate = new Date().toISOString();
        saveConfig(currentConfig);
        
        // Save a list of local backups to localStorage for reference
        try {
          const localBackups = JSON.parse(localStorage.getItem('local_backup_list') || '[]');
          localBackups.push({
            name: timestampedFilename,
            path: timestampedFilename,
            updated_at: new Date().toISOString()
          });
          
          // Keep only the last 20 backups in the list
          if (localBackups.length > 20) {
            localBackups.splice(0, localBackups.length - 20);
          }
          
          localStorage.setItem('local_backup_list', JSON.stringify(localBackups));
        } catch (e) {
          console.error('Error updating local backup list', e);
        }
        
        // Check if Supabase backup is enabled and user is authenticated
        if (currentConfig.supabaseEnabled && auth.isAuthenticated() && auth.currentUser?.id) {
          try {
            console.log('Uploading backup to Supabase Storage...');
            
            // The user's ID to use as folder name in storage
            const userId = auth.currentUser.id;
            
            // Upload timestamped backup to user's folder
            const { data: timestampedData, error: timestampedError } = await supabase.storage
              .from(SUPABASE_BACKUP_BUCKET)
              .upload(`${userId}/${timestampedFilename}`, blob);
              
            if (timestampedError) {
              console.error('Error uploading timestamped backup to Supabase:', timestampedError);
            } else {
              console.log('Uploaded timestamped backup to Supabase:', timestampedData);
            }
            
            // Upload/overwrite latest backup to user's folder
            const { data: latestData, error: latestError } = await supabase.storage
              .from(SUPABASE_BACKUP_BUCKET)
              .upload(`${userId}/${syncFilename}`, blob, { upsert: true });
              
            if (latestError) {
              console.error('Error uploading latest backup to Supabase:', latestError);
            } else {
              console.log('Uploaded latest backup to Supabase:', latestData);
              
              // Store Supabase backup information
              try {
                const supabaseBackups = JSON.parse(localStorage.getItem('supabase_backup_list') || '[]');
                supabaseBackups.push({
                  name: timestampedFilename,
                  path: `${userId}/${timestampedFilename}`,
                  updated_at: new Date().toISOString()
                });
                
                // Keep only the last 20 backups in the list
                if (supabaseBackups.length > 20) {
                  supabaseBackups.splice(0, supabaseBackups.length - 20);
                }
                
                localStorage.setItem('supabase_backup_list', JSON.stringify(supabaseBackups));
              } catch (e) {
                console.error('Error updating Supabase backup list', e);
              }
            }
          } catch (err) {
            console.error('Unexpected error uploading to Supabase:', err);
          }
        }
      } catch (e) {
        console.warn('No se pudo guardar en carpeta seleccionada, se usará descarga normal.', e);
      }
    } else {
      console.log('No directory handle found, using browser download instead');
    }

    // Fallback to browser download for the timestamped version if no directory handle
    if (!dirHandle) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = timestampedFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('File download initiated through browser download API');
    }
    
    currentConfig.lastBackupDate = new Date().toISOString();
    saveConfig(currentConfig);
    
    return timestampedFilename;
  } catch (error) {
    console.error('Error creating backup:', error);
    return null;
  }
}

// Add a function to test the storage connection
export async function testSupabaseStorageConnection(): Promise<{ success: boolean; message: string; }> {
  try {
    const auth = Auth.getInstance();
    if (!auth.isAuthenticated()) {
      return { 
        success: false, 
        message: "Necesitas iniciar sesión para usar el respaldo en Supabase" 
      };
    }

    // Test connection with Supabase Storage
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return { 
        success: false, 
        message: `Error de conexión: ${error.message}` 
      };
    }

    // Check if the backup bucket exists
    const backupBucket = buckets.find(b => b.name === SUPABASE_BACKUP_BUCKET);
    if (!backupBucket) {
      return { 
        success: false, 
        message: `No se encontró el bucket de respaldos en Supabase` 
      };
    }
    
    return { 
      success: true, 
      message: "Conexión exitosa con Supabase Storage. Bucket de respaldos encontrado." 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error inesperado: ${error instanceof Error ? error.message : "Error desconocido"}` 
    };
  }
}

// Add function to list available backups from Supabase
export async function listCloudBackups(): Promise<{ name: string; path: string; updated_at: string; }[]> {
  const auth = Auth.getInstance();
  if (!auth.isAuthenticated() || !auth.currentUser?.id) {
    console.log('User not authenticated for cloud backups');
    return [];
  }
  
  try {
    // First check for Supabase backups if enabled
    if (currentConfig.supabaseEnabled) {
      const userId = auth.currentUser.id;
      
      // List files in user's folder in Supabase Storage
      const { data: supabaseFiles, error } = await supabase.storage
        .from(SUPABASE_BACKUP_BUCKET)
        .list(userId);
      
      if (error) {
        console.error("Error listing Supabase backups:", error);
      } else if (supabaseFiles && supabaseFiles.length > 0) {
        // Convert to our backup format
        return supabaseFiles.map(file => ({
          name: file.name,
          path: `${userId}/${file.name}`,
          updated_at: file.updated_at || file.created_at || new Date().toISOString()
        }));
      }
    }
    
    // Fallback to local backups in localStorage
    const backups = localStorage.getItem('local_backup_list');
    if (backups) {
      return JSON.parse(backups);
    }
    return [];
  } catch (error) {
    console.error("Error listing backups:", error);
    return [];
  }
}

// Function to restore backup from Supabase storage
export async function restoreFromSupabaseBackup(path: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BACKUP_BUCKET)
      .download(path);
      
    if (error) {
      console.error('Error downloading backup from Supabase:', error);
      return false;
    }
    
    if (!data) {
      console.error('No data received from Supabase backup');
      return false;
    }
    
    const backupText = await data.text();
    return restoreFromBackupData(backupText);
  } catch (error) {
    console.error('Error restoring backup from Supabase:', error);
    return false;
  }
}

// Helper function to restore from backup data as text
async function restoreFromBackupData(backupText: string): Promise<boolean> {
  try {
    const backupData = JSON.parse(backupText) as BackupData;
    
    if (!backupData.products || !backupData.customers || !backupData.orders || !backupData.tables) {
      console.error('Invalid backup file format');
      return false;
    }

    // Use the correct database version from the error message
    const db = await openDB(DB_NAME, DB_VERSION);
    
    const tx = db.transaction(['products', 'customers', 'orders', 'tables'], 'readwrite');
    
    await tx.objectStore('products').clear();
    await tx.objectStore('customers').clear();
    await tx.objectStore('orders').clear();
    await tx.objectStore('tables').clear();
    
    for (const product of backupData.products) {
      await tx.objectStore('products').add(product);
    }
    
    for (const customer of backupData.customers) {
      await tx.objectStore('customers').add(customer);
    }
    
    for (const order of backupData.orders) {
      await tx.objectStore('orders').add(order);
    }
    
    for (const table of backupData.tables) {
      await tx.objectStore('tables').add(table);
    }
    
    await tx.done;
    
    console.log('Backup restored successfully');
    
    return true;
  } catch (error) {
    console.error('Error restoring backup data:', error);
    return false;
  }
}

export async function restoreFromLocalBackup(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (!e.target || typeof e.target.result !== 'string') {
        console.error('Error reading file');
        resolve(false);
        return;
      }

      const success = await restoreFromBackupData(e.target.result);
      resolve(success);
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      resolve(false);
    };
    
    reader.readAsText(file);
  });
}

export async function restoreFromCloudBackup(path: string): Promise<boolean> {
  try {
    // Check if this is a Supabase path
    if (path.includes('/')) {
      return await restoreFromSupabaseBackup(path);
    }
    
    // This is a placeholder - in a real app, you would download from pCloud
    return false;
  } catch (error) {
    console.error('Error restoring backup from cloud:', error);
    return false;
  }
}

export function startAutoBackup(intervalMinutes: number = 5): void {
  if (backupInterval) {
    clearInterval(backupInterval);
  }
  
  currentConfig.autoBackupEnabled = true;
  currentConfig.backupInterval = intervalMinutes;
  saveConfig(currentConfig);
  
  createBackup();

  backupInterval = window.setInterval(() => {
    createBackup();
  }, intervalMinutes * 60 * 1000);
}

export function stopAutoBackup(): void {
  if (backupInterval) {
    clearInterval(backupInterval);
    currentConfig.autoBackupEnabled = false;
    saveConfig(currentConfig);
  }
}

export function isAutoBackupEnabled(): boolean {
  return currentConfig.autoBackupEnabled;
}

export function getBackupInterval(): number {
  return currentConfig.backupInterval || 5;
}

export function getLastBackupDate(): string | null {
  return currentConfig.lastBackupDate;
}

export function initializeBackupSystem(): void {
  if (isAutoBackupEnabled()) {
    startAutoBackup(getBackupInterval());
  }
}

export function setCloudConfig(config: { cloudEnabled: boolean, cloudBucketName: string, autoCloudBackup?: boolean, supabaseEnabled?: boolean }): void {
  currentConfig.cloudEnabled = config.cloudEnabled;
  currentConfig.cloudBucketName = config.cloudBucketName || BACKUP_BUCKET_NAME;
  
  // Update auto cloud backup setting if provided
  if (typeof config.autoCloudBackup !== 'undefined') {
    currentConfig.autoCloudBackup = config.autoCloudBackup;
  }
  
  // Update Supabase backup setting if provided
  if (typeof config.supabaseEnabled !== 'undefined') {
    currentConfig.supabaseEnabled = config.supabaseEnabled;
  }
  
  saveConfig(currentConfig);
}

export function isCloudEnabled(): boolean {
  return !!currentConfig.cloudEnabled;
}

export function isAutoCloudBackupEnabled(): boolean {
  return !!currentConfig.autoCloudBackup;
}

export function isSupabaseBackupEnabled(): boolean {
  return !!currentConfig.supabaseEnabled;
}

export function setAutoCloudBackup(enabled: boolean): void {
  currentConfig.autoCloudBackup = enabled;
  saveConfig(currentConfig);
}

export function setSupabaseBackupEnabled(enabled: boolean): void {
  currentConfig.supabaseEnabled = enabled;
  saveConfig(currentConfig);
}

export function getCloudBucketName(): string {
  return currentConfig.cloudBucketName || BACKUP_BUCKET_NAME;
}

export async function setupBackupBucket(): Promise<boolean> {
  try {
    // Test if bucket exists and is accessible
    const { success } = await testSupabaseStorageConnection();
    if (success) {
      // Bucket exists and is accessible
      return true;
    }
    
    // If user is not authenticated, we can't setup the bucket
    const auth = Auth.getInstance();
    if (!auth.isAuthenticated()) {
      console.log('User not authenticated, cannot setup backup bucket');
      return false;
    }
    
    // We cannot create buckets from the client, but we can try to access it
    // This would require the bucket to be pre-created on Supabase
    return false;
  } catch (error) {
    console.error('Error in setupBackupBucket:', error);
    return false;
  }
}

export async function testGoogleCloudConnection(): Promise<boolean> {
  // We're using Supabase instead of Google Cloud, so test that connection
  const result = await testSupabaseStorageConnection();
  return result.success;
}
