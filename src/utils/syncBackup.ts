
import { initDB } from "@/lib/db";
import { Auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Intervalo de sincronización en milisegundos (5 minutos)
const SYNC_INTERVAL = 5 * 60 * 1000;

let syncInterval: number | null = null;
let isSyncing = false;
let lastOperationTime = Date.now();
let pendingSync = false;
let syncDebounceTimeout: number | null = null;

/**
 * Obtiene el email del usuario autenticado en Supabase
 */
const getUserEmail = async (): Promise<string | null> => {
  try {
    // Primero intentar obtener el usuario de la sesión activa de Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      return session.user.email;
    }
    
    // Si no hay sesión de Supabase, intentar con Auth local
    const auth = Auth.getInstance();
    if (auth.isAuthenticated() && auth.currentUser?.username) {
      return auth.currentUser.username;
    }
    
    return null;
  } catch (error) {
    console.error("Error al obtener email de usuario:", error);
    return null;
  }
};

/**
 * Prepara los datos para sincronizar con el servidor
 */
export const prepareDataForSync = async () => {
  const db = await initDB();
  const auth = Auth.getInstance();

  // Recopilar datos de la base de datos
  const products = await db.getAll('products');
  const categories = await db.getAll('categories');
  const orders = await db.getAll('orders');
  const tables = await db.getAll('tables');
  const customers = await db.getAll('customers');
  const shifts = await db.getAll('shifts');
  const business = await db.getAll('business');

  // Si no hay datos de negocio, crear uno con ID único
  let businessData = business[0];
  if (!businessData) {
    businessData = {
      id: uuidv4(),
      name: "Mi negocio", // Valor predeterminado
      createdAt: new Date().toISOString()
    };
    
    // Guardar los datos del negocio en IndexedDB para futuros sincronizaciones
    await db.put('business', businessData);
  }

  // Obtener el email del usuario para usarlo como identificador
  const userEmail = await getUserEmail();
  const businessId = userEmail || businessData.id;

  // Crear el objeto de respaldo con datos e ID único del negocio
  return {
    businessId: businessId, // Usar el email como identificador si está disponible
    businessName: businessData.name || "Mi negocio",
    userId: auth.currentUser?.id || uuidv4(),
    timestamp: new Date().toISOString(),
    data: {
      products,
      categories,
      orders,
      tables,
      customers,
      shifts,
    }
  };
};

/**
 * Envía los datos al servidor para ser respaldados
 */
export const syncBackup = async () => {
  if (isSyncing) return false;
  
  try {
    isSyncing = true;
    
    // Preparar datos para sincronizar
    const syncData = await prepareDataForSync();
    
    console.log("Enviando datos para respaldo automático...");
    
    const response = await fetch('https://pizzapos.app/subir_respaldo.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncData)
    });

    // Verificar la respuesta del servidor
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error HTTP: ${response.status} - ${errorText}`);
      return false;
    }

    const result = await response.json();
    
    if (result.success) {
      console.log("Sincronización automática completada:", result.timestamp);
      // Resetear la bandera de sincronización pendiente
      pendingSync = false;
      return true;
    } else {
      console.error("Error en sincronización automática:", result.message);
      return false;
    }
  } catch (error) {
    console.error("Error sincronizando datos automáticamente:", error);
    return false;
  } finally {
    isSyncing = false;
  }
};

/**
 * Nueva función: Notifica que ocurrió una operación y programa una sincronización
 * Esta función debe ser llamada después de cada operación importante (ventas, cambios de inventario, etc.)
 */
export const notifyOperation = () => {
  lastOperationTime = Date.now();
  pendingSync = true;
  
  // Usar un debounce para evitar múltiples sincronizaciones en operaciones rápidas
  if (syncDebounceTimeout !== null) {
    clearTimeout(syncDebounceTimeout);
  }
  
  // Esperar 30 segundos después de la última operación antes de sincronizar
  // Esto evita sincronizaciones excesivas si hay muchas operaciones seguidas
  syncDebounceTimeout = window.setTimeout(() => {
    if (pendingSync) {
      console.log("Ejecutando sincronización tras operación...");
      syncBackup().catch(err => 
        console.error("Error en sincronización tras operación:", err)
      );
    }
    syncDebounceTimeout = null;
  }, 30000); // 30 segundos de espera
};

/**
 * Inicia la sincronización automática cada 5 minutos
 */
export const startAutoSync = () => {
  // Detener cualquier sincronización existente primero
  stopAutoSync();
  
  // Realizar sincronización inicial
  syncBackup().then(success => {
    if (success) {
      toast.success("Sincronización automática activada", {
        description: "Tus datos se sincronizarán automáticamente después de cada operación"
      });
    }
  });
  
  // Establecer intervalo para sincronización periódica (como respaldo adicional)
  syncInterval = window.setInterval(() => {
    // Solo sincronizar si han pasado más de 10 minutos desde la última operación
    // y no hay una sincronización pendiente ya programada
    const timeSinceLastOp = Date.now() - lastOperationTime;
    if (timeSinceLastOp > 10 * 60 * 1000 && !pendingSync) {
      syncBackup().catch(err => 
        console.error("Error en sincronización programada:", err)
      );
    }
  }, SYNC_INTERVAL);
  
  // Guardar preferencia en localStorage
  localStorage.setItem('autoSyncEnabled', 'true');
  
  return true;
};

/**
 * Detiene la sincronización automática
 */
export const stopAutoSync = () => {
  if (syncInterval !== null) {
    clearInterval(syncInterval);
    syncInterval = null;
    
    // Limpiar también el timeout de debounce si existe
    if (syncDebounceTimeout !== null) {
      clearTimeout(syncDebounceTimeout);
      syncDebounceTimeout = null;
    }
    
    // Guardar preferencia en localStorage
    localStorage.setItem('autoSyncEnabled', 'false');
    
    toast.info("Sincronización automática desactivada");
    return true;
  }
  return false;
};

/**
 * Verifica si la sincronización automática está activa
 */
export const isAutoSyncEnabled = (): boolean => {
  return syncInterval !== null || localStorage.getItem('autoSyncEnabled') === 'true';
};

/**
 * Inicializa la sincronización automática basada en preferencias almacenadas
 */
export const initAutoSync = () => {
  if (localStorage.getItem('autoSyncEnabled') === 'true') {
    startAutoSync();
  }
};
