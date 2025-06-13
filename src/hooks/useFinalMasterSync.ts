import { useEffect, useRef, useState } from 'react';
import { useBarber } from '@/contexts/BarberContext';
import { useFinancial } from '@/contexts/FinancialContext';
import { useTips } from './useTips';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { SupabaseBackupService } from '@/services/SupabaseBackupService';

export const useFinalMasterSync = () => {
  const { user } = useSupabaseAuth();
  const barberContext = useBarber();
  const financialContext = useFinancial();
  const { tips } = useTips();
  
  const isInitializedRef = useRef(false);
  const lastBackupTimeRef = useRef<number>(0);
  const lastUserEmailRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'pushing' | 'synced' | 'pulling'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const backupService = new SupabaseBackupService();

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

  // Función para restaurar datos desde Supabase
  const restoreFromSupabase = async () => {
    if (!user?.email || !isReady) return false;

    console.log('🔄 Iniciando pull desde Supabase...');
    setSyncStatus('pulling');

    try {
      const backupData = await backupService.restoreFromSupabase();
      
      console.log('📥 Datos obtenidos desde Supabase, aplicando...');
      
      // Limpiar datos existentes
      barberContext.categories.forEach(c => barberContext.deleteCategory(c.id));
      barberContext.barbers.forEach(b => barberContext.deleteBarber(b.id));
      barberContext.services.forEach(s => barberContext.deleteService(s.id));
      barberContext.products.forEach(p => barberContext.deleteProduct(p.id));
      
      // Restaurar configuraciones de la app
      if (backupData.appSettings) {
        await barberContext.updateAppSettings(backupData.appSettings);
      }

      // Restaurar datos
      if (backupData.categories) backupData.categories.forEach((category: any) => barberContext.addCategory(category));
      if (backupData.barbers) backupData.barbers.forEach((barber: any) => barberContext.addBarber(barber));
      if (backupData.services) backupData.services.forEach((service: any) => barberContext.addService(service));
      if (backupData.products) backupData.products.forEach((product: any) => barberContext.addProduct(product));
      if (backupData.sales) backupData.sales.forEach((sale: any) => {
        if (!barberContext.sales.some(s => s.id === sale.id)) {
          barberContext.addSale(sale);
        }
      });
      if (backupData.cashAdvances) backupData.cashAdvances.forEach((advance: any) => {
        if (!barberContext.cashAdvances.some(a => a.id === advance.id)) {
          barberContext.addCashAdvance(advance);
        }
      });
      if (backupData.promotions) backupData.promotions.forEach((promotion: any) => {
        if (!barberContext.promotions.some(p => p.id === promotion.id)) {
          barberContext.addPromotion(promotion);
        }
      });

      console.log('✅ Pull completado exitosamente desde Supabase');
      setSyncStatus('synced');
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      setSyncStatus('idle');
      return false;
    }
  };

  // Función para hacer respaldo automático a Supabase
  const createAutomaticBackup = async () => {
    if (!user?.email || !isReady) return false;

    console.log('🔄 Iniciando respaldo automático en Supabase...');
    setSyncStatus('pushing');

    try {
      const backupData = createBackupData();
      await backupService.createBackupToSupabase(backupData);
      
      console.log('✅ Respaldo automático completado exitosamente');
      setSyncStatus('synced');
      setLastSyncTime(new Date());
      lastBackupTimeRef.current = Date.now();
      return true;
    } catch (error) {
      setSyncStatus('idle');
      return false;
    }
  };

  // Detectar nuevo inicio de sesión y hacer pull automático
  useEffect(() => {
    const handleNewLogin = async () => {
      if (user?.email && barberContext.isDataLoaded) {
        const currentUserEmail = user.email;
        
        // Si es un usuario diferente o es la primera vez que se carga
        if (lastUserEmailRef.current !== currentUserEmail) {
          console.log('🔄 Nueva sesión detectada, verificando respaldo en Supabase...');
          
          try {
            // Verificar si existe respaldo en Supabase
            const backupExists = await backupService.checkBackupExists();
            
            if (backupExists) {
              console.log('📥 Respaldo encontrado, iniciando pull automático...');
              await restoreFromSupabase();
            } else {
              console.log('📤 No hay respaldo, creando respaldo inicial...');
              await createAutomaticBackup();
            }
          } catch (error) {
            console.error('❌ Error al verificar/restaurar respaldo:', error);
          }
          
          lastUserEmailRef.current = currentUserEmail;
          isInitializedRef.current = true;
          setIsReady(true);
          console.log('✅ Sistema de respaldos listo para:', currentUserEmail);
        } else if (!isInitializedRef.current) {
          // Mismo usuario, solo inicializar
          isInitializedRef.current = true;
          setIsReady(true);
          console.log('✅ Sistema de respaldos reanudado para:', currentUserEmail);
        }
      } else if (!user?.email) {
        // Usuario cerró sesión
        lastUserEmailRef.current = null;
        isInitializedRef.current = false;
        setIsReady(false);
      }
    };

    handleNewLogin();
  }, [user?.email, barberContext.isDataLoaded]);

  // Respaldo automático con debounce - se activa con cambios en los datos
  useEffect(() => {
    if (!user?.email || !isReady) return;

    const now = Date.now();
    const timeSinceLastBackup = now - lastBackupTimeRef.current;
    const BACKUP_DEBOUNCE_TIME = 10000; // 10 segundos

    if (timeSinceLastBackup > BACKUP_DEBOUNCE_TIME) {
      const timeoutId = setTimeout(async () => {
        await createAutomaticBackup();
      }, 2000); // Esperar 2 segundos antes de hacer el respaldo

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
    barberContext.promotions.length,
    financialContext.barberCommissions.length,
    financialContext.operationalExpenses.length,
    tips.length,
    // Escuchar cambios más específicos
    JSON.stringify(barberContext.sales.slice(-1)), // Última venta
    JSON.stringify(barberContext.cashAdvances.slice(-1)), // Último adelanto
    JSON.stringify(barberContext.appSettings) // Configuraciones
  ]);

  // Función para respaldo manual
  const manualPush = async () => {
    console.log('🔄 Respaldo manual iniciado');
    return await createAutomaticBackup();
  };

  return {
    syncStatus,
    lastSyncTime,
    manualPush,
    isInitialized: isInitializedRef.current,
    isReady,
    canSync: !!user?.email && navigator.onLine
  };
};
