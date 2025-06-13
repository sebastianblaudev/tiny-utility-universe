
import { useState, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

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

export type SyncStatus = 'idle' | 'pushing' | 'synced' | 'error';

export const useSimplifiedSync = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Solo push al hosting - sin pull automático
  const pushToHosting = useCallback(async (data: SyncData): Promise<boolean> => {
    if (!user?.email) return false;

    console.log('🔄 Subiendo respaldo al hosting...');
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

      console.log('✅ Respaldo subido exitosamente al hosting');
      
      setSyncStatus('synced');
      setLastSyncTime(new Date());
      
      return true;
    } catch (error) {
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
    error,
    pushToHosting,
    manualBackup,
    canSync: !!user?.email && navigator.onLine
  };
};
