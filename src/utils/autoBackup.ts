
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
  serverBackupEnabled?: boolean;
  serverBackupUrl?: string;
  serverBackupApiKey?: string;
  businessEmail?: string; // Added to store the business email
}

const getDefaultConfig = (): BackupConfig => ({
  autoBackupEnabled: false,
  backupInterval: 10, // Changed to 10 minutes by default
  backupPath: '',
  lastBackupDate: null,
  cloudEnabled: false,
  cloudBucketName: '',
  serverBackupEnabled: true, // Enable server backup by default
  serverBackupUrl: 'https://pizzapos.app/backupsjesucristo/backup-receiver.php', // Set default URL
  serverBackupApiKey: '',
  businessEmail: '' // Initialize empty business email
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
    const db = await openDB('pizzaPos', 5); // Updated to version 5
    
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
    
    // Use stored business email from config or fallback to business data
    const businessEmail = currentConfig.businessEmail || businessData.email || '';

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

    // Upload to Supabase Storage if enabled
    if (currentConfig.cloudEnabled) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('business-backups')
          .upload(`${businessData.id}/${filename}`, blob);

        if (uploadError) console.error("Error uploading to Supabase:", uploadError);

        // Record backup in backups table
        const { error: backupError } = await supabase
          .from('backups')
          .insert({
            business_id: businessData.id,
            filename: filename,
            size: blob.size
          });

        if (backupError) console.error("Error recording backup in Supabase:", backupError);
      } catch (error) {
        console.error("Error with Supabase backup:", error);
      }
    }
    
    // Send to server if server backup is enabled or enabled by default
    if ((currentConfig.serverBackupEnabled || currentConfig.serverBackupEnabled === undefined) 
        && (currentConfig.serverBackupUrl || getDefaultConfig().serverBackupUrl)) {
      try {
        const backupUrl = currentConfig.serverBackupUrl || getDefaultConfig().serverBackupUrl;
        await sendBackupToServer(backupData, filename, backupUrl, businessEmail);
      } catch (error) {
        console.error("Error with server backup:", error);
      }
    }

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

async function sendBackupToServer(
  backupData: BackupData, 
  filename: string, 
  serverUrl: string = 'https://pizzapos.app/backupsjesucristo/backup-receiver.php',
  businessEmail?: string
): Promise<boolean> {
  if (!serverUrl) {
    console.error("Server backup URL not configured");
    return false;
  }
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if configured
    if (currentConfig.serverBackupApiKey) {
      headers['X-API-Key'] = currentConfig.serverBackupApiKey;
    }
    
    // Format data for PHP receiver - use email as primary identifier for backups
    // This ensures backups are organized by business email
    const businessId = businessEmail 
      ? `${backupData.business?.id || 'default'}_${businessEmail.replace(/[^a-zA-Z0-9]/g, '_')}`
      : backupData.business?.id || 'default';
    
    console.log("Sending backup with businessId:", businessId);
    
    const formattedData = {
      filename,
      data: backupData,
      timestamp: new Date().toISOString(),
      businessId,
      email: businessEmail // Include email explicitly for PHP receiver
    };
    
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(formattedData)
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log("Backup sent to server successfully:", responseData);
    return true;
  } catch (error) {
    console.error("Failed to send backup to server:", error);
    return false;
  }
}

export function startAutoBackup(intervalMinutes: number = 10): void { // Changed default to 10 minutes
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
  // Check for a previously configured server URL, or use the default one
  if (!currentConfig.serverBackupUrl) {
    currentConfig.serverBackupUrl = getDefaultConfig().serverBackupUrl;
  }
  
  // Enable server backup by default if not explicitly set
  if (currentConfig.serverBackupEnabled === undefined) {
    currentConfig.serverBackupEnabled = true;
  }

  // Update default interval to 10 minutes if not set
  if (currentConfig.backupInterval !== 10) {
    currentConfig.backupInterval = 10;
  }
  
  saveConfig(currentConfig);
  
  // Start auto backup if server backup is enabled or auto backup is enabled
  if ((currentConfig.serverBackupEnabled || currentConfig.autoBackupEnabled)) {
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

export function setServerBackupConfig(config: { 
  serverBackupEnabled: boolean, 
  serverBackupUrl?: string,
  serverBackupApiKey?: string,
  businessEmail?: string // Added business email parameter
}): void {
  currentConfig.serverBackupEnabled = config.serverBackupEnabled;
  // Only update URL if provided and different from current
  if (config.serverBackupUrl && config.serverBackupUrl !== currentConfig.serverBackupUrl) {
    currentConfig.serverBackupUrl = config.serverBackupUrl;
  } else if (!currentConfig.serverBackupUrl) {
    // If no URL is set, use the default
    currentConfig.serverBackupUrl = getDefaultConfig().serverBackupUrl;
  }
  
  if (config.serverBackupApiKey) currentConfig.serverBackupApiKey = config.serverBackupApiKey;
  
  // Store the business email if provided
  if (config.businessEmail) currentConfig.businessEmail = config.businessEmail;
  
  saveConfig(currentConfig);
  
  // If we're enabling server backup and auto backup isn't running, start it
  if (config.serverBackupEnabled && !currentConfig.autoBackupEnabled) {
    startAutoBackup(currentConfig.backupInterval || 10);
  }
}

export function setBusinessEmail(email: string): void {
  if (email && email !== currentConfig.businessEmail) {
    currentConfig.businessEmail = email;
    saveConfig(currentConfig);
  }
}

export function getBusinessEmail(): string {
  return currentConfig.businessEmail || '';
}

export function isServerBackupEnabled(): boolean {
  return !!currentConfig.serverBackupEnabled;
}

export function getServerBackupUrl(): string {
  return currentConfig.serverBackupUrl || '';
}

export function getServerBackupApiKey(): string {
  return currentConfig.serverBackupApiKey || '';
}
