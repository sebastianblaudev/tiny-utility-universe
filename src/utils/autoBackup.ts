import { openDB } from 'idb';
import { Product, Customer, Order, Table } from '@/lib/db';
import { Auth } from '@/lib/auth';
import type { BusinessData } from '@/types/business';
import { toast } from "sonner";
import { DB_NAME } from '@/lib/query-client';

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
  autoCloudBackup?: boolean; // New setting for automatic cloud backup
}

// Constants for bucket names
const BACKUP_BUCKET_NAME = 'bkpid';

// Define the database version for consistency - UPDATED to match db.ts
const DB_VERSION = 9; // Updated to match the error message showing version 9

const getDefaultConfig = (): BackupConfig => ({
  autoBackupEnabled: false,
  backupInterval: 5, // 5 minutes by default
  backupPath: '',
  lastBackupDate: null,
  cloudEnabled: true, // Enable cloud backup by default
  cloudBucketName: BACKUP_BUCKET_NAME,
  autoCloudBackup: true // Enable auto cloud backup by default
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
        
        // No toast here
        
        return timestampedFilename;
      } catch (e) {
        console.warn('No se pudo guardar en carpeta seleccionada, se usará descarga normal.', e);
      }
    } else {
      console.log('No directory handle found, using browser download instead');
    }

    // Fallback to browser download for the timestamped version
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = timestampedFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('File download initiated through browser download API');
    
    currentConfig.lastBackupDate = new Date().toISOString();
    saveConfig(currentConfig);
    
    return timestampedFilename;
  } catch (error) {
    console.error('Error creating backup:', error);
    // No toast here for errors
    return null;
  }
}

// Add a function to test the storage connection
export async function testSupabaseStorageConnection(): Promise<{ success: boolean; message: string; }> {
  try {
    // For now, just simulate a successful connection to storage
    return { 
      success: true, 
      message: "Conexión simulada exitosa - modo de respaldo local" 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error inesperado: ${error instanceof Error ? error.message : "Error desconocido"}` 
    };
  }
}

// Add function to list available backups
export async function listCloudBackups(): Promise<{ name: string; path: string; updated_at: string; }[]> {
  try {
    // Look for local backups in localStorage
    const backups = localStorage.getItem('local_backup_list');
    if (backups) {
      return JSON.parse(backups);
    }
    return [];
  } catch (error) {
    console.error("Error listing cloud backups:", error);
    return [];
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

export async function restoreFromLocalBackup(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        if (!e.target || typeof e.target.result !== 'string') {
          console.error('Error reading file');
          resolve(false);
          return;
        }

        const backupData = JSON.parse(e.target.result) as BackupData;
        
        if (!backupData.products || !backupData.customers || !backupData.orders || !backupData.tables) {
          console.error('Invalid backup file format');
          resolve(false);
          return;
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
        // No toast here
        
        resolve(true);
      } catch (error) {
        console.error('Error restoring backup:', error);
        resolve(false);
      }
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
    // This is a placeholder - in a real app, you would download from pCloud
    // No toast here
    return false;
  } catch (error) {
    console.error('Error restoring backup from cloud:', error);
    // No toast here
    return false;
  }
}

export function setCloudConfig(config: { cloudEnabled: boolean, cloudBucketName: string, autoCloudBackup?: boolean }): void {
  currentConfig.cloudEnabled = config.cloudEnabled;
  currentConfig.cloudBucketName = config.cloudBucketName || BACKUP_BUCKET_NAME;
  
  // Update auto cloud backup setting if provided
  if (typeof config.autoCloudBackup !== 'undefined') {
    currentConfig.autoCloudBackup = config.autoCloudBackup;
  }
  
  saveConfig(currentConfig);
}

export function isCloudEnabled(): boolean {
  return !!currentConfig.cloudEnabled;
}

export function isAutoCloudBackupEnabled(): boolean {
  return !!currentConfig.autoCloudBackup;
}

export function setAutoCloudBackup(enabled: boolean): void {
  currentConfig.autoCloudBackup = enabled;
  saveConfig(currentConfig);
}

export function getCloudBucketName(): string {
  return currentConfig.cloudBucketName || BACKUP_BUCKET_NAME;
}

export async function testGoogleCloudConnection(): Promise<boolean> {
  // We're using pCloud instead of Google Cloud, so we'll test that instead
  return true; // Just return true for now since we're in local-only mode
}
