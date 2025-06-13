import { useEffect, useRef, useState } from 'react';
import { useSimplifiedSync } from './useSimplifiedSync';
import { useBarber } from '@/contexts/BarberContext';
import { useFinancial } from '@/contexts/FinancialContext';
import { useTips } from './useTips';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const useOptimizedMasterSync = () => {
  const { user } = useSupabaseAuth();
  const barberContext = useBarber();
  const financialContext = useFinancial();
  const { tips } = useTips();
  const { syncStatus, lastSyncTime, error, pushToHosting, manualBackup } = useSimplifiedSync();
  
  const isInitializedRef = useRef(false);
  const lastBackupTimeRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);

  // Crear datos completos para respaldo
  const createBackupData = () => {
    return {
      businessEmail: user?.email || '',
      timestamp: new Date().toISOString(),
      appSettings: barberContext.appSettings,
      barbers: barberContext.barbers,
      services: barberContext.services,
      products: barberContext.products,
      categories: barberContext.categories,
      sales: barberContext.sales,
      cashAdvances: barberContext.cashAdvances,
      promotions: barberContext.promotions,
      barberCommissions: financialContext.barberCommissions,
      operationalExpenses: financialContext.operationalExpenses,
      tips: tips,
      exportDate: new Date().toISOString(),
      version: '1.0',
      backupType: 'automatic'
    };
  };

  // Inicialización simplificada
  useEffect(() => {
    if (user?.email && barberContext.isDataLoaded && !isInitializedRef.current) {
      isInitializedRef.current = true;
      setIsReady(true);
      console.log('✅ Sistema de respaldos inicializado para:', user.email);
    } else if (!user?.email) {
      isInitializedRef.current = false;
      setIsReady(false);
    }
  }, [user?.email, barberContext.isDataLoaded]);

  // Respaldo automático con debounce
  useEffect(() => {
    if (!user?.email || !isReady) return;

    const now = Date.now();
    const timeSinceLastBackup = now - lastBackupTimeRef.current;
    const BACKUP_DEBOUNCE_TIME = 10000; // 10 segundos

    // Solo hacer respaldo si ha pasado suficiente tiempo
    if (timeSinceLastBackup > BACKUP_DEBOUNCE_TIME) {
      const timeoutId = setTimeout(async () => {
        try {
          const backupData = createBackupData();
          await pushToHosting(backupData);
          lastBackupTimeRef.current = Date.now();
        } catch (error) {
          // Silenciar error
        }
      }, 2000); // Delay de 2 segundos

      return () => clearTimeout(timeoutId);
    }
  }, [
    user?.email,
    isReady,
    barberContext.barbers.length,
    barberContext.services.length,
    barberContext.products.length,
    barberContext.sales.length,
    barberContext.cashAdvances.length,
    financialContext.barberCommissions.length,
    financialContext.operationalExpenses.length,
    tips.length,
    pushToHosting
  ]);

  // Función para respaldo manual
  const manualPush = async () => {
    try {
      const backupData = createBackupData();
      return await manualBackup(backupData);
    } catch (error) {
      return false;
    }
  };

  const checkPendingChanges = () => {
    // Siempre indicar que hay cambios para permitir respaldos manuales
    return true;
  };

  return {
    syncStatus,
    lastSyncTime,
    error,
    manualPull: () => Promise.resolve(null), // Eliminado - solo respaldos
    manualPush,
    checkPendingChanges,
    isInitialized: isInitializedRef.current,
    isReady,
    canSync: !!user?.email && navigator.onLine
  };
};
