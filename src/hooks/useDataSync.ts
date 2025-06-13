import { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

const WEBHOOK_URL = 'https://barberpos.ventapos.app/bkp/webhook_backup.php';
const SYNC_METADATA_KEY = 'barberpos-sync-metadata';

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

export type SyncStatus = 'idle' | 'pulling' | 'pushing' | 'synced' | 'error' | 'conflict';

export const useDataSync = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función para generar hash de datos
  const generateDataHash = useCallback((data: SyncData): string => {
    const dataString = JSON.stringify({
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
      timestamp: data.timestamp
    });
    return btoa(dataString);
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

  // Pull: Descargar datos del hosting
  const pullFromHosting = useCallback(async (): Promise<SyncData | null> => {
    if (!user?.email) return null;

    console.log('🔄 Iniciando pull desde hosting...');
    setSyncStatus('pulling');
    setError(null);

    try {
      const safeEmail = sanitizeEmail(user.email);
      const jsonUrl = `https://barberpos.ventapos.app/bkp/backups/backup_${safeEmail}.json`;
      const timestamp = Date.now();
      const urlWithTimestamp = `${jsonUrl}?t=${timestamp}&r=${Math.random()}`;

      const response = await fetch(urlWithTimestamp, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        setSyncStatus('idle');
        return null;
      }

      const jsonContent = await response.text();
      const remoteData = JSON.parse(jsonContent);

      console.log('✅ Pull exitoso desde hosting');
      
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
    }
  }, [user?.email, sanitizeEmail, getSyncMetadata, saveSyncMetadata]);

  // Push: Subir datos al hosting
  const pushToHosting = useCallback(async (data: SyncData): Promise<boolean> => {
    if (!user?.email) return false;

    console.log('🔄 Iniciando push al hosting...');
    setSyncStatus('pushing');
    setError(null);

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

      console.log('✅ Push exitoso al hosting');
      
      // Actualizar metadata
      const metadata = getSyncMetadata();
      metadata.lastPushTime = new Date().toISOString();
      metadata.lastDataHash = generateDataHash(data);
      metadata.userEmail = user.email;
      saveSyncMetadata(metadata);

      setSyncStatus('synced');
      setLastSyncTime(new Date());
      
      toast({
        title: "Datos sincronizados",
        description: "Los cambios se han guardado en la nube"
      });

      return true;
    } catch (error) {
      setSyncStatus('idle');
      return false;
    }
  }, [user?.email, generateDataHash, getSyncMetadata, saveSyncMetadata, toast]);

  // Función principal de sincronización
  const syncData = useCallback(async (localData: SyncData, isInitialLoad = false): Promise<SyncData | null> => {
    if (!user?.email || isSyncingRef.current) return localData;

    isSyncingRef.current = true;

    try {
      const metadata = getSyncMetadata();
      const currentDataHash = generateDataHash(localData);

      // Si es carga inicial, hacer pull primero
      if (isInitialLoad) {
        console.log('🚀 Sincronización inicial - Pull primero');
        const remoteData = await pullFromHosting();
        
        if (remoteData) {
          // Comparar timestamps
          const localTime = new Date(localData.timestamp).getTime();
          const remoteTime = new Date(remoteData.timestamp).getTime();
          
          if (remoteTime > localTime) {
            console.log('📥 Datos remotos más recientes - Usando versión del hosting');
            return remoteData;
          } else if (localTime > remoteTime) {
            console.log('📤 Datos locales más recientes - Subiendo al hosting');
            await pushToHosting(localData);
            return localData;
          } else {
            console.log('🟰 Datos iguales - No hay cambios');
            setSyncStatus('synced');
            return localData;
          }
        } else {
          // No hay datos remotos, subir los locales
          console.log('📤 No hay datos remotos - Subiendo datos locales');
          await pushToHosting(localData);
          return localData;
        }
      } else {
        // Para cambios normales, solo push si hay cambios reales
        if (currentDataHash !== metadata.lastDataHash) {
          console.log('📤 Detectados cambios locales - Subiendo al hosting');
          await pushToHosting(localData);
        } else {
          console.log('🔄 Sin cambios detectados');
          setSyncStatus('synced');
        }
        return localData;
      }
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setSyncStatus('error');
      return localData;
    } finally {
      isSyncingRef.current = false;
    }
  }, [user?.email, generateDataHash, getSyncMetadata, pullFromHosting, pushToHosting]);

  // Función para sincronización manual
  const forcePull = useCallback(async (): Promise<SyncData | null> => {
    console.log('🔄 Pull manual iniciado');
    return await pullFromHosting();
  }, [pullFromHosting]);

  // Función para push manual
  const forcePush = useCallback(async (data: SyncData): Promise<boolean> => {
    console.log('🔄 Push manual iniciado');
    return await pushToHosting(data);
  }, [pushToHosting]);

  // Función para verificar si hay cambios pendientes
  const hasPendingChanges = useCallback((data: SyncData): boolean => {
    const metadata = getSyncMetadata();
    const currentHash = generateDataHash(data);
    return currentHash !== metadata.lastDataHash;
  }, [generateDataHash, getSyncMetadata]);

  // Auto-sync periódico (cada 5 minutos)
  useEffect(() => {
    if (!user?.email) return;

    const interval = setInterval(async () => {
      if (!isSyncingRef.current && syncStatus !== 'pulling' && syncStatus !== 'pushing') {
        console.log('🔄 Auto-pull periódico');
        await pullFromHosting();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [user?.email, syncStatus, pullFromHosting]);

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
