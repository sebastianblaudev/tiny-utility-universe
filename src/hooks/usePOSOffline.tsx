import { useState, useEffect, useCallback } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { saveMixedPaymentMethods } from '@/lib/supabase-helpers';
import { saveProductNotes } from '@/utils/productNoteUtils';
import { processRobustSale } from '@/utils/robustOfflineUtils';

interface POSOfflineHook {
  processOfflineSale: (saleData: any) => Promise<{ success: boolean; saleId?: string }>;
  loadOfflineProducts: () => Promise<any[]>;
  updateLocalProductStock: (productId: string, newStock: number) => Promise<void>;
  isProcessing: boolean;
}

export const usePOSOffline = (): POSOfflineHook => {
  const { isOnline, queueSaleForSync, getOfflineProducts, cacheProducts } = useOffline();
  const [isProcessing, setIsProcessing] = useState(false);

  // Process a sale offline or online with ultra-robust response
  const processOfflineSale = async (saleData: any): Promise<{ success: boolean; saleId?: string }> => {
    console.log('💨 Ultra-robust sale processing started');
    setIsProcessing(true);
    
    try {
      // Use the robust sale processing that works regardless of connectivity/date
      const result = await processRobustSale(saleData);
      console.log('⚡ Robust sale completed:', result);
      return result;
    } catch (error) {
      console.error('Critical sale processing error:', error);
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };


  // Load products for offline use with ultra-fast caching
  const loadOfflineProducts = useCallback(async (): Promise<any[]> => {
    const startTime = performance.now();
    
    try {
      // Use memory cache first for instant loading
      const memoryCache = (window as any).__productCache;
      if (memoryCache && memoryCache.data && memoryCache.timestamp > Date.now() - 300000) { // 5 min cache
        console.log(`Loaded ${memoryCache.data.length} products from memory cache instantly`);
        return memoryCache.data;
      }
      
      // Use enhanced cache for fast loading
      const { enhancedCache } = await import('@/utils/offlineCache');
      
      // Try cache first for instant UX
      const cachedProducts = await enhancedCache.getAllCachedProducts?.() || [];
      
      if (cachedProducts.length > 0) {
        // Store in memory cache for ultra-fast subsequent loads
        (window as any).__productCache = {
          data: cachedProducts,
          timestamp: Date.now()
        };
        
        const loadTime = performance.now() - startTime;
        console.log(`Loaded ${cachedProducts.length} products from cache in ${loadTime.toFixed(2)}ms`);
        
        // Trigger ultra-low priority background sync if online
        if (isOnline) {
          setTimeout(async () => {
            try {
              const cachedTenantId = localStorage.getItem('current_tenant_id');
              if (cachedTenantId) {
                const { data: freshProducts, error } = await supabase
                  .from('products')
                  .select('*')
                  .eq('tenant_id', cachedTenantId)
                  .order('updated_at', { ascending: false });

                if (!error && freshProducts && freshProducts.length !== cachedProducts.length) {
                  await enhancedCache.cacheProducts?.(freshProducts, 2);
                  // Update memory cache
                  (window as any).__productCache = {
                    data: freshProducts,
                    timestamp: Date.now()
                  };
                  console.log(`Background sync: updated cache with ${freshProducts.length} fresh products`);
                }
              }
            } catch (error) {
              console.warn('Background sync warning:', error);
            }
          }, 5000); // Delayed background sync
        }
        
        return cachedProducts;
      }

      // If no cache and online, load from database with optimized query
      if (isOnline) {
        console.log('Loading products from database (no cache available)');
        const cachedTenantId = localStorage.getItem('current_tenant_id');
        
        if (cachedTenantId) {
          const { data: products, error } = await supabase
            .from('products')
            .select('id, name, price, stock, barcode, image_url, is_by_weight, unit')
            .eq('tenant_id', cachedTenantId)
            .order('name');

          if (!error && products) {
            // Cache with high priority for future loads
            await enhancedCache.cacheProducts?.(products, 4);
            
            // Store in memory cache
            (window as any).__productCache = {
              data: products,
              timestamp: Date.now()
            };
            
            const loadTime = performance.now() - startTime;
            console.log(`Initial load: cached ${products.length} products in ${loadTime.toFixed(2)}ms`);
            return products;
          }
        }
      }
      
      // Final fallback to basic offline products
      console.log('Using basic offline fallback');
      return await getOfflineProducts();
      
    } catch (error) {
      console.error('Error loading products:', error);
      
      // If online fetch fails, try offline gracefully
      try {
        const offlineProducts = await getOfflineProducts();
        if (offlineProducts.length > 0) {
          console.log(`Fallback: loaded ${offlineProducts.length} products from basic offline storage`);
          return offlineProducts;
        }
      } catch (offlineError) {
        console.error('Error loading offline products:', offlineError);
      }
      
      console.warn('No products available in any storage');
      return [];
    }
  }, [isOnline, getOfflineProducts]);

  // Update product stock locally (for offline mode)
  const updateLocalProductStock = async (productId: string, newStock: number): Promise<void> => {
    try {
      const { offlineManager } = await import('@/utils/offlineUtils');
      await offlineManager.updateProductStock(productId, newStock);
    } catch (error) {
      console.error('Error updating local product stock:', error);
    }
  };

  return {
    processOfflineSale,
    loadOfflineProducts,
    updateLocalProductStock,
    isProcessing,
  };
};