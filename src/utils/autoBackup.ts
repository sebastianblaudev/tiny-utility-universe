import { openDB } from 'idb';
import { Product, Customer, Order, Table } from '@/lib/db';
import { Auth } from '@/lib/auth';
import type { BusinessData } from '@/types/business';
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
}

const getDefaultConfig = (): BackupConfig => ({
  autoBackupEnabled: false,
  backupInterval: 5, // 5 minutes by default
  backupPath: '',
  lastBackupDate: null,
  cloudEnabled: false,
  cloudBucketName: ''
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
    return true;
  } catch (error) {
    console.error('Error selecting directory:', error);
    return false;
  }
}

export async function createBackup(): Promise<string | null> {
  try {
    const db = await openDB('pizzaPos', 4);
    
    const products = await db.getAll('products');
    const customers = await db.getAll('customers');
    const orders = await db.getAll('orders');
    const tables = await db.getAll('tables');

    const businessData = await db.get('business', 1) as BusinessData | undefined;
    
    if (!businessData) {
      throw new Error('No business data found');
    }

    const auth = Auth.getInstance();
    const tenantId = auth.isAuthenticated() ? auth.currentUser?.id : 'anonymous';

    const backupData: BackupData = {
      products,
      customers,
      orders,
      tables,
      timestamp: new Date().toISOString(),
      tenantId: tenantId || 'anonymous',
      business: businessData || null
    };

    const filename = `pizzapos_backup_${businessData.name}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('business-backups')
      .upload(`${businessData.id}/${filename}`, blob);

    if (uploadError) throw uploadError;

    // Record backup in backups table
    const { error: backupError } = await supabase
      .from('backups')
      .insert({
        business_id: businessData.id,
        filename: filename,
        size: blob.size
      });

    if (backupError) throw backupError;

    const dirHandle = (window as any)._backupDirectoryHandle;
    if (dirHandle) {
      try {
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(backupData, null, 2));
        await writable.close();
        currentConfig.lastBackupDate = new Date().toISOString();
        saveConfig(currentConfig);
        console.log('Backup local creado:', filename);
        return filename;
      } catch (e) {
        console.warn('No se pudo guardar en carpeta seleccionada, se usará descarga normal.', e);
      }
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    currentConfig.lastBackupDate = new Date().toISOString();
    saveConfig(currentConfig);
    
    return filename;
  } catch (error) {
    console.error('Error creating backup:', error);
    return null;
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

        const db = await openDB('pizzaPos', 4);
        
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

export function setCloudConfig(config: { cloudEnabled: boolean, cloudBucketName: string }): void {
  currentConfig.cloudEnabled = config.cloudEnabled;
  currentConfig.cloudBucketName = config.cloudBucketName;
  saveConfig(currentConfig);
}

export function isCloudEnabled(): boolean {
  return !!currentConfig.cloudEnabled;
}

export function getCloudBucketName(): string {
  return currentConfig.cloudBucketName || '';
}

export async function testGoogleCloudConnection(): Promise<boolean> {
  return false;
}
