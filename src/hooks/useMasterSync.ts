
import { useEffect, useRef } from 'react';
import { useDataSync } from './useDataSync';
import { useBarber } from '@/contexts/BarberContext';
import { useFinancial } from '@/contexts/FinancialContext';
import { useTips } from './useTips';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const useMasterSync = () => {
  const { user } = useSupabaseAuth();
  const barberContext = useBarber();
  const financialContext = useFinancial();
  const { tips } = useTips();
  const { syncData, syncStatus, lastSyncTime, error, forcePull, forcePush, hasPendingChanges } = useDataSync();
  
  const isInitializedRef = useRef(false);
  const lastSyncHashRef = useRef<string>('');

  // Crear datos completos para sincronización
  const createFullSyncData = () => {
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

  // Aplicar datos sincronizados a los contextos
  const applySyncData = (data: any) => {
    // Actualizar BarberContext
    if (data.appSettings) barberContext.updateAppSettings(data.appSettings);
    
    // Para arrays, solo actualizar si hay cambios reales
    if (data.barbers && JSON.stringify(data.barbers) !== JSON.stringify(barberContext.barbers)) {
      // Limpiar y recargar barbers
      data.barbers.forEach((barber: any) => {
        const existing = barberContext.barbers.find(b => b.id === barber.id);
        if (!existing) {
          barberContext.addBarber(barber);
        } else if (JSON.stringify(existing) !== JSON.stringify(barber)) {
          barberContext.updateBarber(barber);
        }
      });
    }

    // Similar para otros arrays...
    if (data.services && JSON.stringify(data.services) !== JSON.stringify(barberContext.services)) {
      data.services.forEach((service: any) => {
        const existing = barberContext.services.find(s => s.id === service.id);
        if (!existing) {
          barberContext.addService(service);
        } else if (JSON.stringify(existing) !== JSON.stringify(service)) {
          barberContext.updateService(service);
        }
      });
    }

    // Continuar con products, categories, sales, etc.
    if (data.products) {
      data.products.forEach((product: any) => {
        const existing = barberContext.products.find(p => p.id === product.id);
        if (!existing) {
          barberContext.addProduct(product);
        } else if (JSON.stringify(existing) !== JSON.stringify(product)) {
          barberContext.updateProduct(product);
        }
      });
    }

    if (data.categories) {
      data.categories.forEach((category: any) => {
        const existing = barberContext.categories.find(c => c.id === category.id);
        if (!existing) {
          barberContext.addCategory(category);
        } else if (JSON.stringify(existing) !== JSON.stringify(category)) {
          barberContext.updateCategory(category);
        }
      });
    }

    if (data.sales) {
      data.sales.forEach((sale: any) => {
        const existing = barberContext.sales.find(s => s.id === sale.id);
        if (!existing) {
          barberContext.addSale(sale);
        } else if (JSON.stringify(existing) !== JSON.stringify(sale)) {
          barberContext.updateSale(sale);
        }
      });
    }

    if (data.cashAdvances) {
      data.cashAdvances.forEach((advance: any) => {
        const existing = barberContext.cashAdvances.find(a => a.id === advance.id);
        if (!existing) {
          barberContext.addCashAdvance(advance);
        } else if (JSON.stringify(existing) !== JSON.stringify(advance)) {
          barberContext.updateCashAdvance(advance);
        }
      });
    }

    if (data.promotions) {
      data.promotions.forEach((promotion: any) => {
        const existing = barberContext.promotions.find(p => p.id === promotion.id);
        if (!existing) {
          barberContext.addPromotion(promotion);
        } else if (JSON.stringify(existing) !== JSON.stringify(promotion)) {
          barberContext.updatePromotion(promotion);
        }
      });
    }

    // Aplicar datos financieros
    if (data.barberCommissions) {
      data.barberCommissions.forEach((commission: any) => {
        const existing = financialContext.barberCommissions.find(c => c.id === commission.id);
        if (!existing) {
          financialContext.addBarberCommission(commission);
        } else if (JSON.stringify(existing) !== JSON.stringify(commission)) {
          financialContext.updateBarberCommission(commission);
        }
      });
    }

    if (data.operationalExpenses) {
      data.operationalExpenses.forEach((expense: any) => {
        const existing = financialContext.operationalExpenses.find(e => e.id === expense.id);
        if (!existing) {
          financialContext.addOperationalExpense(expense);
        } else if (JSON.stringify(existing) !== JSON.stringify(expense)) {
          financialContext.updateOperationalExpense(expense);
        }
      });
    }

    console.log('✅ Datos sincronizados aplicados a los contextos');
  };

  // Sincronización inicial al autenticarse
  useEffect(() => {
    if (user?.email && !isInitializedRef.current) {
      isInitializedRef.current = true;
      
      console.log('🚀 Iniciando sincronización inicial para:', user.email);
      
      // Pequeño delay para asegurar que los contextos estén cargados
      setTimeout(async () => {
        const localData = createFullSyncData();
        const syncedData = await syncData(localData, true);
        
        if (syncedData && syncedData !== localData) {
          applySyncData(syncedData);
        }
      }, 1000);
    } else if (!user?.email) {
      isInitializedRef.current = false;
    }
  }, [user?.email]);

  // Sincronización en cambios de datos
  useEffect(() => {
    if (!user?.email || !isInitializedRef.current) return;

    // Crear hash de datos actuales
    const currentData = createFullSyncData();
    const currentHash = JSON.stringify({
      barbers: currentData.barbers.length,
      services: currentData.services.length,
      products: currentData.products.length,
      categories: currentData.categories.length,
      sales: currentData.sales.length,
      cashAdvances: currentData.cashAdvances.length,
      promotions: currentData.promotions.length,
      commissions: currentData.barberCommissions.length,
      expenses: currentData.operationalExpenses.length,
      tips: currentData.tips.length
    });

    // Solo sincronizar si hay cambios reales
    if (currentHash !== lastSyncHashRef.current && lastSyncHashRef.current !== '') {
      console.log('📤 Cambios detectados, sincronizando...');
      syncData(currentData, false);
    }

    lastSyncHashRef.current = currentHash;
  }, [
    user?.email,
    barberContext.barbers,
    barberContext.services,
    barberContext.products,
    barberContext.categories,
    barberContext.sales,
    barberContext.cashAdvances,
    barberContext.promotions,
    financialContext.barberCommissions,
    financialContext.operationalExpenses,
    tips
  ]);

  // Funciones para uso manual
  const manualPull = async () => {
    const remoteData = await forcePull();
    if (remoteData) {
      applySyncData(remoteData);
    }
    return remoteData;
  };

  const manualPush = async () => {
    const currentData = createFullSyncData();
    return await forcePush(currentData);
  };

  const checkPendingChanges = () => {
    const currentData = createFullSyncData();
    return hasPendingChanges(currentData);
  };

  return {
    syncStatus,
    lastSyncTime,
    error,
    manualPull,
    manualPush,
    checkPendingChanges,
    isInitialized: isInitializedRef.current,
    canSync: !!user?.email
  };
};
