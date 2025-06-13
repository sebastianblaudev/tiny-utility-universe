import { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

const WEBHOOK_URL = 'https://barberpos.ventapos.app/bkp/webhook_backup.php';
const SYNC_METADATA_KEY = 'barberpos-sync-metadata';
const SYNC_DEBOUNCE_TIME = 2000; // 2 segundos de debounce

interface SyncData {
  businessEmail: string;
  timestamp: string;
  appSettings: any;
  barbers: any[];
  services: any[];
  products: any[];
  categories: any[];
  sales: any[];
  cashAdvances: any[];
  promotions: any[];
  barberCommissions: any[];
  operationalExpenses: any[];
  tips: any[];
  exportDate: string;
  version: string;
  backupType: string;
}

interface SyncMetadata {
  lastPushTime: string | null;
  lastPullTime: string | null;
  lastDataHash: string;
  userEmail: string;
}

export type SyncStatus = 'idle' | 'pulling' | 'pushing' | 'synced' | 'error';

export const useOptimizedDataSync = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataHashRef = useRef<string>('');

  // Función optimizada para generar hash de datos
  const generateDataHash = useCallback((data: SyncData): string => {
    const relevantData = {
      barbers: data.barbers.length,
      services: data.services.length,
      products: data.products.length,
      categories: data.categories.length,
      sales: data.sales.length,
      cashAdvances: data.cashAdvances.length,
      promotions: data.promotions.length,
      commissions: data.barberCommissions.length,
      expenses: data.operationalExpenses.length,
      tips: data.tips.length,
      settingsHash: JSON.stringify(data.appSettings).length
    };
    return btoa(JSON.stringify(relevantData));
  }, []);

  // Función para sanitizar email
  const sanitizeEmail = useCallback((email: string): string => {
    return email.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }, []);

  // Obtener metadata de sincronización
  const getSyncMetadata = useCallback((): SyncMetadata => {
    const stored = localStorage.getItem(SYNC_METADATA_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Si hay error parsing, crear nuevo metadata
      }
    }
    return {
      lastPushTime: null,
      lastPullTime: null,
      lastDataHash: '',
      userEmail: user?.email || ''
    };
  }, [user?.email]);

  // Guardar metadata de sincronización
  const saveSyncMetadata = useCallback((metadata: SyncMetadata) => {
    localStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
  }, []);

  // Pull optimizado: Descargar datos del hosting
  const pullFromHosting = useCallback(async (): Promise<SyncData | null> => {
    if (!user?.email || isSyncingRef.current) return null;

    console.log('🔄 Iniciando pull optimizado desde hosting...');
    setSyncStatus('pulling');
    setError(null);
    isSyncingRef.current = true;

    try {
      const safeEmail = sanitizeEmail(user.email);
      const jsonUrl = `https://barberpos.ventapos.app/bkp/backups/backup_${safeEmail}.json`;
      const timestamp = Date.now();
      const urlWithTimestamp = `${jsonUrl}?t=${timestamp}`;

      const response = await fetch(urlWithTimestamp, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('📄 No hay respaldo remoto disponible');
          setSyncStatus('synced');
          return null;
        }
        setSyncStatus('idle');
        return null;
      }

      const jsonContent = await response.text();
      const remoteData = JSON.parse(jsonContent);

      console.log('✅ Pull optimizado exitoso desde hosting');
      
      // Actualizar metadata
      const metadata = getSyncMetadata();
      metadata.lastPullTime = new Date().toISOString();
      metadata.userEmail = user.email;
      saveSyncMetadata(metadata);

      setSyncStatus('synced');
      setLastSyncTime(new Date());
      
      return remoteData;
    } catch (error) {
      setSyncStatus('idle');
      return null;
    } finally {
      isSyncingRef.current = false;
    }
  }, [user?.email, sanitizeEmail, getSyncMetadata, saveSyncMetadata]);

  // Push optimizado: Subir datos al hosting con debounce
  const pushToHosting = useCallback(async (data: SyncData): Promise<boolean> => {
    if (!user?.email || isSyncingRef.current) return false;

    // Verificar si realmente hay cambios
    const currentHash = generateDataHash(data);
    if (currentHash === lastDataHashRef.current) {
      console.log('🔄 Sin cambios detectados, omitiendo push');
      return true;
    }

    console.log('🔄 Iniciando push optimizado al hosting...');
    setSyncStatus('pushing');
    setError(null);
    isSyncingRef.current = true;

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        setSyncStatus('idle');
        return false;
      }

      console.log('✅ Push optimizado exitoso al hosting');
      
      // Actualizar metadata y hash
      const metadata = getSyncMetadata();
      metadata.lastPushTime = new Date().toISOString();
      metadata.lastDataHash = currentHash;
      metadata.userEmail = user.email;
      saveSyncMetadata(metadata);
      
      lastDataHashRef.current = currentHash;

      setSyncStatus('synced');
      setLastSyncTime(new Date());
      
      return true;
    } catch (error) {
      setSyncStatus('idle');
      return false;
    } finally {
      isSyncingRef.current = false;
    }
  }, [user?.email, generateDataHash, getSyncMetadata, saveSyncMetadata]);

  // Función principal de sincronización con debounce
  const syncData = useCallback((localData: SyncData, isInitialLoad = false): Promise<SyncData | null> => {
    return new Promise((resolve) => {
      // Limpiar timeout anterior
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Configurar nuevo timeout con debounce
      syncTimeoutRef.current = setTimeout(async () => {
        if (!user?.email || isSyncingRef.current) {
          resolve(localData);
          return;
        }

        try {
          if (isInitialLoad) {
            console.log('🚀 Sincronización inicial optimizada');
            const remoteData = await pullFromHosting();
            
            if (remoteData) {
              const localTime = new Date(localData.timestamp).getTime();
              const remoteTime = new Date(remoteData.timestamp).getTime();
              
              if (remoteTime > localTime) {
                console.log('📥 Datos remotos más recientes');
                resolve(remoteData);
                return;
              }
            }
            
            // Datos locales más recientes o no hay remotos
            await pushToHosting(localData);
            resolve(localData);
          } else {
            // Para cambios normales, solo push si hay cambios
            await pushToHosting(localData);
            resolve(localData);
          }
        } catch (error) {
          console.error('❌ Error en sincronización optimizada:', error);
          setError(error instanceof Error ? error.message : 'Error desconocido');
          setSyncStatus('error');
          resolve(localData);
        }
      }, isInitialLoad ? 100 : SYNC_DEBOUNCE_TIME);
    });
  }, [user?.email, pullFromHosting, pushToHosting]);

  // Funciones para uso manual
  const forcePull = useCallback(async (): Promise<SyncData | null> => {
    console.log('🔄 Pull manual optimizado iniciado');
    return await pullFromHosting();
  }, [pullFromHosting]);

  const forcePush = useCallback(async (data: SyncData): Promise<boolean> => {
    console.log('🔄 Push manual optimizado iniciado');
    // Resetear hash para forzar push
    lastDataHashRef.current = '';
    return await pushToHosting(data);
  }, [pushToHosting]);

  const hasPendingChanges = useCallback((data: SyncData): boolean => {
    const metadata = getSyncMetadata();
    const currentHash = generateDataHash(data);
    return currentHash !== metadata.lastDataHash;
  }, [generateDataHash, getSyncMetadata]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    syncStatus,
    lastSyncTime,
    error,
    syncData,
    forcePull,
    forcePush,
    hasPendingChanges,
    isOnline: navigator.onLine,
    canSync: !!user?.email && navigator.onLine
  };
};
