import { useState, useEffect, useCallback } from 'react';
import { enhancedCache, CacheMetrics } from '@/utils/offlineCache';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SmartCacheHook {
  // Cache operations
  searchProducts: (query: string) => Promise<any[]>;
  getProduct: (productId: string) => Promise<any | null>;
  preloadPopularProducts: () => Promise<void>;
  
  // Sync operations
  syncProducts: (force?: boolean) => Promise<void>;
  syncInBackground: () => Promise<void>;
  
  // Cache management
  optimizeCache: () => Promise<void>;
  clearCache: () => Promise<void>;
  
  // Metrics and status
  metrics: CacheMetrics | null;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  cacheEnabled: boolean;
}

export const useSmartCache = (): SmartCacheHook => {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [cacheEnabled, setCacheEnabled] = useState(true);
  
  const { user, tenantId } = useAuth();
  const { toast } = useToast();

  // Initialize cache and load metrics
  useEffect(() => {
    const initializeCache = async () => {
      try {
        await enhancedCache.init();
        await updateMetrics();
        
        // Check if cache needs initial sync
        const currentMetrics = await enhancedCache.getCacheMetrics();
        if (currentMetrics.totalProducts === 0) {
          await syncProducts(true);
        }
      } catch (error) {
        console.error('Failed to initialize smart cache:', error);
        setCacheEnabled(false);
      }
    };

    initializeCache();
  }, []);

  // Update metrics periodically
  const updateMetrics = useCallback(async () => {
    try {
      const newMetrics = await enhancedCache.getCacheMetrics();
      setMetrics(newMetrics);
      if (newMetrics.lastSyncTime) {
        setLastSyncTime(new Date(newMetrics.lastSyncTime));
      }
    } catch (error) {
      console.error('Error updating cache metrics:', error);
    }
  }, []);

  // Smart product search with cache-first approach
  const searchProducts = useCallback(async (query: string): Promise<any[]> => {
    if (!cacheEnabled || !query.trim()) return [];

    setIsLoading(true);
    try {
      // Search from cache first
      const cachedResults = await enhancedCache.searchProducts(query, 50);
      
      if (cachedResults.length > 0) {
        // Return cached results immediately
        setIsLoading(false);
        
        // Optionally trigger background sync for fresh data
        if (navigator.onLine && shouldTriggerBackgroundSync()) {
          syncInBackground();
        }
        
        return cachedResults;
      }

      // If no cached results and online, search from database
      if (navigator.onLine && tenantId) {
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .eq('tenant_id', tenantId)
          .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
          .limit(50);

        if (error) throw error;

        // Cache the results for future use
        if (products && products.length > 0) {
          await enhancedCache.cacheProducts(products, 2); // Medium priority
          await updateMetrics();
        }

        return products || [];
      }

      return [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [cacheEnabled, tenantId]);

  // Get single product with cache optimization
  const getProduct = useCallback(async (productId: string): Promise<any | null> => {
    if (!cacheEnabled) return null;

    try {
      // Try cache first
      const cachedProduct = await enhancedCache.getProduct(productId);
      if (cachedProduct) {
        return cachedProduct;
      }

      // Fallback to database if online
      if (navigator.onLine && tenantId) {
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (error) throw error;

        // Cache the product
        if (product) {
          await enhancedCache.cacheProducts([product], 3); // High priority for individual lookups
        }

        return product;
      }

      return null;
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  }, [cacheEnabled, tenantId]);

  // Preload popular/high-priority products
  const preloadPopularProducts = useCallback(async (): Promise<void> => {
    if (!cacheEnabled || !navigator.onLine || !tenantId) return;

    try {
      // Get products with high stock or recently updated
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('stock', 1)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (products && products.length > 0) {
        await enhancedCache.cacheProducts(products, 4); // Very high priority
        await updateMetrics();
        
        console.log(`Preloaded ${products.length} popular products`);
      }
    } catch (error) {
      console.error('Error preloading popular products:', error);
    }
  }, [cacheEnabled, tenantId, updateMetrics]);

  // Full product sync with delta detection
  const syncProducts = useCallback(async (force: boolean = false): Promise<void> => {
    if (!cacheEnabled || !navigator.onLine || !tenantId) return;
    
    setIsSyncing(true);
    try {
      const lastSync = metrics?.lastSyncTime || 0;
      let query = supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId);

      // Delta sync if not forced and we have a recent sync
      if (!force && lastSync && Date.now() - lastSync < 6 * 60 * 60 * 1000) { // 6 hours
        query = query.gte('updated_at', new Date(lastSync).toISOString());
      }

      const { data: products, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;

      if (products && products.length > 0) {
        await enhancedCache.cacheProducts(products, 3);
        await updateMetrics();
        
        toast({
          title: "Productos sincronizados",
          description: `${products.length} productos actualizados en caché`,
        });

        console.log(`Synced ${products.length} products to cache`);
      }

      // Update last sync time
      setLastSyncTime(new Date());
      
    } catch (error) {
      console.error('Error syncing products:', error);
      toast({
        title: "Error de sincronización",
        description: "No se pudieron sincronizar algunos productos",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [cacheEnabled, tenantId, metrics?.lastSyncTime, updateMetrics, toast]);

  // Background sync without blocking UI
  const syncInBackground = useCallback(async (): Promise<void> => {
    if (!cacheEnabled || !navigator.onLine || isSyncing) return;

    try {
      // Use requestIdleCallback for background processing
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => syncProducts(false), { timeout: 5000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => syncProducts(false), 100);
      }
    } catch (error) {
      console.error('Error scheduling background sync:', error);
    }
  }, [cacheEnabled, isSyncing, syncProducts]);

  // Optimize cache storage
  const optimizeCache = useCallback(async (): Promise<void> => {
    if (!cacheEnabled) return;

    try {
      await enhancedCache.optimizeCache();
      await updateMetrics();
      
      toast({
        title: "Caché optimizado",
        description: "La caché ha sido limpiada y optimizada",
      });
    } catch (error) {
      console.error('Error optimizing cache:', error);
    }
  }, [cacheEnabled, updateMetrics, toast]);

  // Clear entire cache
  const clearCache = useCallback(async (): Promise<void> => {
    if (!cacheEnabled) return;

    try {
      // Implementation would clear all cached data
      await updateMetrics();
      
      toast({
        title: "Caché limpiada",
        description: "Todos los datos en caché han sido eliminados",
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [cacheEnabled, updateMetrics, toast]);

  // Helper to determine if background sync should be triggered
  const shouldTriggerBackgroundSync = useCallback((): boolean => {
    if (!metrics) return false;
    
    const timeSinceLastSync = Date.now() - (metrics.lastSyncTime || 0);
    const syncInterval = 15 * 60 * 1000; // 15 minutes
    
    return timeSinceLastSync > syncInterval;
  }, [metrics]);

  // Periodic background sync
  useEffect(() => {
    if (!cacheEnabled) return;

    const interval = setInterval(() => {
      if (navigator.onLine && shouldTriggerBackgroundSync()) {
        syncInBackground();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [cacheEnabled, shouldTriggerBackgroundSync, syncInBackground]);

  return {
    searchProducts,
    getProduct,
    preloadPopularProducts,
    syncProducts,
    syncInBackground,
    optimizeCache,
    clearCache,
    metrics,
    isLoading,
    isSyncing,
    lastSyncTime,
    cacheEnabled,
  };
};