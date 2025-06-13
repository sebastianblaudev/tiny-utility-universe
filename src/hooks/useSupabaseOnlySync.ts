
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseRealtimeData } from '@/hooks/useSupabaseRealtimeData';
import { useToast } from '@/hooks/use-toast';

export type SyncStatus = 'idle' | 'pulling' | 'pushing' | 'synced';

export const useSupabaseOnlySync = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { isDataLoaded, refreshData } = useSupabaseRealtimeData();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isReady, setIsReady] = useState(false);

  const canSync = user !== null;

  useEffect(() => {
    if (user && isDataLoaded) {
      setIsReady(true);
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } else if (!user) {
      setIsReady(false);
      setSyncStatus('idle');
      setLastSyncTime(null);
    }
  }, [user, isDataLoaded]);

  const manualPush = useCallback(async (): Promise<boolean> => {
    if (!canSync) {
      console.log('❌ No se puede sincronizar: usuario no autenticado');
      return false;
    }

    setSyncStatus('pushing');
    try {
      console.log('🔄 Iniciando push manual a Base de Datos...');
      
      // Los datos ya están en Base de Datos en tiempo real
      // Solo confirmamos que la conexión está activa
      await refreshData();
      
      setSyncStatus('synced');
      setLastSyncTime(new Date());
      console.log('✅ Push manual completado');
      
      toast({
        title: "Sincronización completada",
        description: "Todos los datos están actualizados en Base de Datos",
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error en push manual:', error);
      setSyncStatus('idle');
      toast({
        title: "Error de sincronización",
        description: "No se pudo completar la sincronización",
        variant: "destructive"
      });
      return false;
    }
  }, [canSync, refreshData, toast]);

  const manualPull = useCallback(async (): Promise<boolean> => {
    if (!canSync) {
      console.log('❌ No se puede sincronizar: usuario no autenticado');
      return false;
    }

    setSyncStatus('pulling');
    try {
      console.log('🔄 Iniciando pull manual desde Base de Datos...');
      
      // Refrescar todos los datos desde Base de Datos
      await refreshData();
      
      setSyncStatus('synced');
      setLastSyncTime(new Date());
      console.log('✅ Pull manual completado');
      
      toast({
        title: "Datos actualizados",
        description: "Se han cargado los datos más recientes de Base de Datos",
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error en pull manual:', error);
      setSyncStatus('idle');
      toast({
        title: "Error de sincronización",
        description: "No se pudo completar la sincronización",
        variant: "destructive"
      });
      return false;
    }
  }, [canSync, refreshData, toast]);

  return {
    syncStatus,
    lastSyncTime,
    manualPush,
    manualPull,
    isReady,
    canSync
  };
};
