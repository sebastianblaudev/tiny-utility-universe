import { useState, useEffect, useCallback } from 'react';
import { offlineManager, syncQueuedSales, registerBackgroundSync } from '@/utils/offlineUtils';
import { useToast } from '@/hooks/use-toast';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedSalesCount, setQueuedSalesCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      toast({
        title: "Conexión restaurada",
        description: "Sincronizando datos pendientes...",
      });
      
      try {
        await syncQueuedSales();
        await updateQueuedSalesCount();
        
        toast({
          title: "Sincronización completada",
          description: "Todos los datos han sido sincronizados",
        });
      } catch (error) {
        console.error('Sync error:', error);
        toast({
          title: "Error de sincronización",
          description: "Algunos datos no pudieron sincronizarse",
          variant: "destructive",
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Sin conexión",
        description: "Trabajando en modo offline. Las ventas se guardarán localmente.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const updateQueuedSalesCount = async () => {
    try {
      const queuedSales = await offlineManager.getQueuedSales();
      setQueuedSalesCount(queuedSales.length);
    } catch (error) {
      console.error('Error getting queued sales count:', error);
    }
  };

  const initializeOffline = async () => {
    try {
      await offlineManager.init();
      await updateQueuedSalesCount();
      
      // Register service worker and background sync
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
          await registerBackgroundSync('sync-sales');
        } catch (error) {
          console.warn('Service worker registration failed:', error);
        }
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize offline functionality:', error);
    }
  };

  useEffect(() => {
    initializeOffline();
  }, []);

  const queueSaleForSync = async (saleData: any) => {
    try {
      await offlineManager.queueSale({
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...saleData,
        timestamp: Date.now(),
      });
      await updateQueuedSalesCount();
      
      toast({
        title: "Venta guardada",
        description: "La venta se sincronizará cuando se restaure la conexión",
      });

      // Try to register background sync
      try {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          await registerBackgroundSync('sync-sales');
        }
      } catch (error) {
        console.warn('Background sync registration failed:', error);
      }
    } catch (error) {
      console.error('Error queuing sale:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la venta offline",
        variant: "destructive",
      });
    }
  };

  const syncNow = async () => {
    if (!isOnline) {
      toast({
        title: "Sin conexión",
        description: "No es posible sincronizar sin conexión a internet",
        variant: "destructive",
      });
      return;
    }

    try {
      await syncQueuedSales();
      await updateQueuedSalesCount();
      
      toast({
        title: "Sincronización completada",
        description: "Todos los datos han sido sincronizados",
      });
    } catch (error) {
      console.error('Manual sync error:', error);
      toast({
        title: "Error de sincronización",
        description: "Error al sincronizar los datos",
        variant: "destructive",
      });
    }
  };

  const cacheProducts = async (products: any[]) => {
    try {
      const offlineProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        code: product.code,
        stock: product.stock,
        category: product.category,
        lastSync: Date.now(),
      }));

      await offlineManager.storeProducts(offlineProducts);
      console.log('Products cached for offline use');
    } catch (error) {
      console.error('Error caching products:', error);
    }
  };

  const getOfflineProducts = useCallback(async () => {
    try {
      return await offlineManager.getOfflineProducts();
    } catch (error) {
      console.error('Error getting offline products:', error);
      return [];
    }
  }, []); // Empty dependency array since offlineManager is static

  const searchOfflineProducts = async (query: string) => {
    try {
      return await offlineManager.searchProducts(query);
    } catch (error) {
      console.error('Error searching offline products:', error);
      return [];
    }
  };

  return {
    isOnline,
    queuedSalesCount,
    isInitialized,
    queueSaleForSync,
    syncNow,
    cacheProducts,
    getOfflineProducts,
    searchOfflineProducts,
    updateQueuedSalesCount,
  };
};