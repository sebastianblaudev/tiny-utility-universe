import { openDB } from 'idb';
import { DB_NAME } from '@/lib/query-client';
import { Auth } from '@/lib/auth';

// Tipos para los datos de respaldo
export interface BackupData {
  products: any[];
  customers: any[];
  orders: any[];
  tables: any[];
  business: any;
  timestamp: string;
  businessId: string;
}

// Tipo para la configuración de respaldos
export interface BackupConfig {
  enabled: boolean;
  interval: number; // en minutos
  lastBackupDate?: string;
  serverBackupEnabled?: boolean;
  serverBackupUrl?: string;
}

/**
 * Genera un respaldo de todos los datos del negocio
 */
export const generateBackup = async (): Promise<BackupData | null> => {
  try {
    // Verificar autenticación
    const auth = Auth.getInstance();
    if (!auth.isAuthenticated() || !auth.currentUser?.id) {
      console.error('Usuario no autenticado para crear respaldo');
      return null;
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
    
    if (!business) {
      console.error('No se encontraron datos de negocio');
      return null;
    }

    // Crear objeto de datos del respaldo
    const backupData: BackupData = {
      products,
      customers,
      orders,
      tables,
      business,
      timestamp: new Date().toISOString(),
      businessId: business.id || userId, // Usar ID del negocio o del usuario como identificador
    };
    
    return backupData;
  } catch (error) {
    console.error('Error al generar respaldo:', error);
    return null;
  }
};

/**
 * Sube un respaldo al servidor usando el endpoint PHP
 */
export const uploadBackupToServer = async (data: BackupData): Promise<boolean> => {
  try {
    // Obtenemos la URL del servidor desde la configuración o usamos la predeterminada
    const config = await getBackupConfig();
    const serverUrl = config?.serverBackupUrl || 'https://pizzapos.app/subir_respaldo.php';
    
    if (!serverUrl) {
      console.error('URL del servidor de respaldos no configurada');
      return false;
    }
    
    // Conseguir el ID de negocio
    const businessId = data.businessId || data.business?.id || 'default';
    
    // Preparamos el cuerpo de la solicitud según el formato esperado por el PHP
    const requestBody = {
      id_negocio: businessId,
      respaldo: data
    };
    
    // Hacemos la solicitud al servidor PHP
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      console.error('Error al subir respaldo al servidor:', await response.text());
      return false;
    }
    
    // Intentamos procesar la respuesta como JSON
    try {
      const result = await response.json();
      console.log("Respuesta del servidor:", result);
    } catch (e) {
      console.log("Respuesta recibida pero no es JSON");
    }
    
    console.log('Respaldo subido exitosamente al servidor');
    return true;
  } catch (error) {
    console.error('Error al subir respaldo al servidor:', error);
    return false;
  }
};

/**
 * Carga la configuración de respaldo
 */
export const getBackupConfig = async (): Promise<BackupConfig | null> => {
  try {
    const db = await openDB(DB_NAME, 9);
    
    // Intentar cargar configuración existente
    let config = await db.get('settings', 'backup_config') as BackupConfig | undefined;
    
    // Si no existe, crear configuración predeterminada
    if (!config) {
      config = {
        enabled: false,
        interval: 60, // 1 hora por defecto
        serverBackupEnabled: false,
        serverBackupUrl: 'https://pizzapos.app/subir_respaldo.php', // URL predeterminada de PHP
      };
      
      // Guardar configuración predeterminada
      await db.put('settings', config, 'backup_config');
    }
    
    return config;
  } catch (error) {
    console.error('Error al cargar configuración de respaldo:', error);
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
      },
      ...config,
    };
    
    // Guardar configuración actualizada
    await db.put('settings', updatedConfig, 'backup_config');
    
    return true;
  } catch (error) {
    console.error('Error al actualizar configuración de respaldo:', error);
    return false;
  }
};

/**
 * Realiza un respaldo y lo sube al servidor PHP
 */
export const performServerBackup = async (): Promise<boolean> => {
  try {
    // Verificar si los respaldos al servidor están habilitados
    const config = await getBackupConfig();
    if (!config?.serverBackupEnabled) {
      console.log('Respaldos al servidor deshabilitados');
      return false;
    }
    
    // Generar respaldo
    const backupData = await generateBackup();
    if (!backupData) {
      console.error('No se pudo generar el respaldo');
      return false;
    }
    
    // Subir al servidor PHP
    const uploaded = await uploadBackupToServer(backupData);
    if (!uploaded) {
      console.error('No se pudo subir el respaldo al servidor PHP');
      return false;
    }
    
    // Actualizar fecha del último respaldo
    await updateBackupConfig({
      lastBackupDate: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error al realizar respaldo al servidor:', error);
    return false;
  }
};

/**
 * Inicia respaldos periódicos al servidor
 */
export const startServerBackups = async (intervalMinutes: number): Promise<boolean> => {
  try {
    // Detener respaldos existentes
    stopServerBackups();
    
    // Actualizar configuración
    const updated = await updateBackupConfig({
      serverBackupEnabled: true,
      interval: intervalMinutes
    });
    
    if (!updated) {
      console.error('No se pudo actualizar la configuración de respaldo');
      return false;
    }
    
    // Iniciar nuevo temporizador
    const intervalId = window.setInterval(async () => {
      console.log('Iniciando respaldo automático al servidor');
      await performServerBackup();
    }, intervalMinutes * 60 * 1000);
    
    // Almacenar ID del temporizador
    window.localStorage.setItem('serverBackupIntervalId', intervalId.toString());
    
    console.log(`Respaldos al servidor iniciados con intervalo de ${intervalMinutes} minutos`);
    return true;
  } catch (error) {
    console.error('Error al iniciar respaldos al servidor:', error);
    return false;
  }
};

/**
 * Detiene respaldos periódicos al servidor
 */
export const stopServerBackups = (): boolean => {
  try {
    // Recuperar ID del temporizador
    const intervalIdStr = window.localStorage.getItem('serverBackupIntervalId');
    if (intervalIdStr) {
      const intervalId = parseInt(intervalIdStr, 10);
      window.clearInterval(intervalId);
      window.localStorage.removeItem('serverBackupIntervalId');
    }
    
    return true;
  } catch (error) {
    console.error('Error al detener respaldos al servidor:', error);
    return false;
  }
};

/**
 * Restaura datos desde un respaldo
 */
export const restoreFromBackup = async (backupData: BackupData): Promise<boolean> => {
  try {
    const db = await openDB(DB_NAME, 9);
    
    // Iniciar transacción
    const tx = db.transaction(
      ['products', 'customers', 'orders', 'tables', 'business'], 
      'readwrite'
    );
    
    // Limpiar tablas
    await tx.objectStore('products').clear();
    await tx.objectStore('customers').clear();
    await tx.objectStore('orders').clear();
    await tx.objectStore('tables').clear();
    
    // Restaurar datos
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
    
    // Restaurar datos de negocio
    await tx.objectStore('business').put(backupData.business);
    
    // Confirmar transacción
    await tx.done;
    
    console.log('Datos restaurados exitosamente');
    return true;
  } catch (error) {
    console.error('Error al restaurar datos:', error);
    return false;
  }
};
