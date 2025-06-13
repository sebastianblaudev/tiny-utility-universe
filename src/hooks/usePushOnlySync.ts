
import { useState, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const WEBHOOK_URL = 'https://barberpos.ventapos.app/bkp/webhook_backup.php';

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

export type SyncStatus = 'idle' | 'pushing' | 'synced';

export const usePushOnlySync = () => {
  const { user } = useSupabaseAuth();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Solo push al hosting - sin mensajes de error
  const pushToHosting = useCallback(async (data: SyncData): Promise<boolean> => {
    if (!user?.email) return false;

    console.log('🔄 Guardando respaldo...');
    setSyncStatus('pushing');

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log('✅ Respaldo guardado exitosamente');
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error guardando respaldo:', error);
      setSyncStatus('idle');
      return false;
    }
  }, [user?.email]);

  // Función manual para subir datos
  const manualBackup = useCallback(async (data: SyncData): Promise<boolean> => {
    console.log('🔄 Respaldo manual iniciado');
    return await pushToHosting(data);
  }, [pushToHosting]);

  return {
    syncStatus,
    lastSyncTime,
    pushToHosting,
    manualBackup,
    canSync: !!user?.email && navigator.onLine
  };
};
