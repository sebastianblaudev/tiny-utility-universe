import { openDB } from 'idb';
import { Product, Customer, Order, Table } from '@/lib/db';
import { Auth } from '@/lib/auth';
import { uploadBackupToFTP } from './ftpBackup';

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
}

interface BackupConfig {
  autoBackupEnabled: boolean;
  backupInterval: number; // en minutos
  backupPath: string;
  lastBackupDate: string | null;
}

interface FTPBackupConfig extends BackupConfig {
  ftpEnabled: boolean;
  ftpHost: string;
  ftpUser: string;
  ftpPassword: string;
  ftpPath: string;
}

const getDefaultConfig = (): FTPBackupConfig => ({
  autoBackupEnabled: false,
  backupInterval: 5, // 5 minutos por defecto
  backupPath: '',
  lastBackupDate: null,
  ftpEnabled: false,
  ftpHost: '',
  ftpUser: '',
  ftpPassword: '',
  ftpPath: '/backups'
});

const loadConfig = (): FTPBackupConfig => {
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

const saveConfig = (config: FTPBackupConfig): void => {
  localStorage.setItem('backup_config', JSON.stringify(config));
};

let currentConfig = loadConfig();

const DIR_HANDLE_KEY = "backup_directory_handle_v1";

export async function selectBackupDirectory(): Promise<boolean> {
  // Verificar si estamos en un iframe (para mostrar mensaje específico)
  const isInIframe = window !== window.top;
  if (isInIframe) {
    console.warn('Esta aplicación está corriendo en un iframe, lo que puede limitar el acceso a archivos. Por favor, abre la aplicación directamente en una pestaña.');
  }
  
  if (!('showDirectoryPicker' in window) || !window.showDirectoryPicker) {
    alert('Tu navegador no es compatible con la File System Access API. Usa Chrome o Edge.');
    return false;
  }
  
  try {
    const dirHandle = await window.showDirectoryPicker();
    if ('storage' in navigator && 'persist' in navigator.storage) {
      await navigator.storage.persist();
    }
    window["backupDirHandle"] = dirHandle;
    const handleId = dirHandle.name;
    localStorage.setItem(DIR_HANDLE_KEY, handleId);
    (window as any)._backupDirectoryHandle = dirHandle;
    alert("Carpeta de destino para backups seleccionada correctamente.");
    return true;
  } catch (e) {
    console.error("Error seleccionando carpeta", e);
    
    // Mensaje más claro para errores específicos
    if (e instanceof Error && e.name === 'SecurityError' && isInIframe) {
      alert('No se puede seleccionar una carpeta mientras la aplicación esté en un iframe. Abre la aplicación directamente en una nueva pestaña.');
    } else {
      alert(`No se pudo seleccionar la carpeta: ${e instanceof Error ? e.message : 'Error desconocido'}`);
    }
    
    return false;
  }
}

async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (!('showDirectoryPicker' in window) || !window.showDirectoryPicker) return null;
  if ((window as any)._backupDirectoryHandle) return (window as any)._backupDirectoryHandle;
  return null;
}

export function setBackupPath(path: string): void {
  currentConfig.backupPath = path;
  saveConfig(currentConfig);
}

export async function createBackup(): Promise<string | null> {
  try {
    // Abrir la base de datos con la versión actual (4 según los logs de error)
    const db = await openDB('pizzaPos', 4);
    if (!db) {
      console.error("No se pudo abrir la base de datos para el respaldo");
      return null;
    }
    
    // Verificar si existen los almacenes antes de intentar leerlos
    const storeNames = db.objectStoreNames;
    
    let products: Product[] = [];
    let customers: Customer[] = [];
    let orders: Order[] = [];
    let tables: Table[] = [];
    
    try {
      if (storeNames.contains('products')) {
        products = await db.getAll('products');
      }
      if (storeNames.contains('customers')) {
        customers = await db.getAll('customers');
      }
      if (storeNames.contains('orders')) {
        orders = await db.getAll('orders');
      }
      if (storeNames.contains('tables')) {
        tables = await db.getAll('tables');
      }
    } catch (err) {
      console.error('Error al leer datos para respaldo:', err);
    }

    const auth = Auth.getInstance();
    const tenantId = auth.isAuthenticated() ? auth.currentUser?.id : 'anonymous';

    const backupData: BackupData = {
      products,
      customers,
      orders,
      tables,
      timestamp: new Date().toISOString(),
      tenantId: tenantId || 'anonymous'
    };

    const filename = `pizzapos_backup_${tenantId}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const jsonData = JSON.stringify(backupData, null, 2);

    // Si FTP está habilitado, intentar subir el backup
    if (currentConfig.ftpEnabled) {
      try {
        const ftpSuccess = await uploadBackupToFTP(jsonData, filename, {
          host: currentConfig.ftpHost,
          user: currentConfig.ftpUser,
          password: currentConfig.ftpPassword,
          path: currentConfig.ftpPath
        });
        
        if (ftpSuccess) {
          console.log('Backup subido exitosamente al servidor FTP');
        } else {
          console.error('Error al subir backup al servidor FTP');
        }
      } catch (ftpError) {
        console.error('Error en FTP:', ftpError);
      }
    }

    // Continuar con el backup local como fallback
    const handle = await getDirectoryHandle();
    if (handle) {
      try {
        const fileHandle = await handle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(backupData, null, 2));
        await writable.close();
        currentConfig.lastBackupDate = new Date().toISOString();
        saveConfig(currentConfig);
        console.log('Backup guardado en carpeta seleccionada:', filename);
        return filename;
      } catch (e) {
        console.warn('No se pudo guardar en carpeta seleccionada, se usará descarga normal.', e);
      }
    }

    // Método alternativo: descargar archivo
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    currentConfig.lastBackupDate = new Date().toISOString();
    saveConfig(currentConfig);

    console.log('Backup local creado:', filename);
    return filename;
  } catch (error) {
    console.error('Error creando backup:', error);
    return null;
  }
}

export function setFTPConfig(config: Partial<FTPBackupConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config
  };
  saveConfig(currentConfig);
}

export async function restoreFromLocalBackup(backupFile: File): Promise<boolean> {
  try {
    const fileContent = await backupFile.text();
    const backupData = JSON.parse(fileContent) as BackupData;
    
    const db = await openDB('pizzaPos', 4); // Usar versión 4 en lugar de 1
    
    await db.clear('products');
    await db.clear('customers');
    await db.clear('orders');
    await db.clear('tables');
    
    for (const product of backupData.products) {
      await db.put('products', product);
    }
    
    for (const customer of backupData.customers) {
      await db.put('customers', customer);
    }
    
    for (const order of backupData.orders) {
      await db.put('orders', order);
    }
    
    for (const table of backupData.tables) {
      await db.put('tables', table);
    }
    
    console.log('Backup restaurado con éxito');
    return true;
  } catch (error) {
    console.error('Error restaurando backup:', error);
    return false;
  }
}

export function getLastBackupDate(): string | null {
  return currentConfig.lastBackupDate;
}

let backupInterval: number;

export function startAutoBackup(intervalMinutes: number = 10): void {
  if (backupInterval) {
    clearInterval(backupInterval);
  }
  
  currentConfig.autoBackupEnabled = true;
  currentConfig.backupInterval = intervalMinutes;
  saveConfig(currentConfig);
  
  const interval = intervalMinutes * 60 * 1000;

  // Crear un backup inicial
  createBackup().then(filename => {
    if (filename) {
      console.log(`Backup inicial creado: ${filename}`);
    }
  }).catch(err => {
    console.error('Error creando backup inicial:', err);
  });

  // Configurar intervalo para backups automaticos
  backupInterval = window.setInterval(() => {
    createBackup().then(filename => {
      if (filename) {
        console.log(`Backup automático creado: ${filename}`);
      }
    }).catch(err => {
      console.error('Error creando backup automático:', err);
    });
  }, interval);
  
  console.log(`Auto backup iniciado - ejecutándose cada ${intervalMinutes} minutos`);
}

export function stopAutoBackup(): void {
  if (backupInterval) {
    clearInterval(backupInterval);
    currentConfig.autoBackupEnabled = false;
    saveConfig(currentConfig);
    console.log('Auto backup detenido');
  }
}

export function isAutoBackupEnabled(): boolean {
  return currentConfig.autoBackupEnabled;
}

export function getBackupInterval(): number {
  return currentConfig.backupInterval;
}

export function initializeBackupSystem(): void {
  if (currentConfig.autoBackupEnabled) {
    startAutoBackup(currentConfig.backupInterval);
  }
}
