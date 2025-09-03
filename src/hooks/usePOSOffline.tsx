import { useState, useEffect, useCallback } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { saveMixedPaymentMethods } from '@/lib/supabase-helpers';
import { saveProductNotes } from '@/utils/productNoteUtils';

interface POSOfflineHook {
  processOfflineSale: (saleData: any) => Promise<{ success: boolean; saleId?: string }>;
  loadOfflineProducts: () => Promise<any[]>;
  updateLocalProductStock: (productId: string, newStock: number) => Promise<void>;
  isProcessing: boolean;
}

export const usePOSOffline = (): POSOfflineHook => {
  const { isOnline, queueSaleForSync, getOfflineProducts, cacheProducts } = useOffline();
  const [isProcessing, setIsProcessing] = useState(false);

  // Process a sale offline or online with ultra-fast response
  const processOfflineSale = async (saleData: any): Promise<{ success: boolean; saleId?: string }> => {
    console.log('💨 Ultra-fast sale processing started');
    const startTime = performance.now();
    
    setIsProcessing(true);
    
    try {
      if (isOnline) {
        // Try online processing with optimized flow
        try {
          const result = await processOnlineSale(saleData);
          const processTime = performance.now() - startTime;
          console.log(`⚡ Online sale completed in ${processTime.toFixed(2)}ms`);
          return result;
        } catch (onlineError) {
          console.warn('Online sale failed, immediate offline fallback:', onlineError);
          // Instant fallback to offline
          return await fallbackToOffline(saleData);
        }
      } else {
        // Direct offline processing for maximum speed
        return await processDirectOffline(saleData);
      }
    } catch (error) {
      console.error('Critical sale processing error:', error);
      // Last resort offline save
      return await emergencyOfflineSave(saleData);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function for direct offline processing
  const processDirectOffline = async (saleData: any): Promise<{ success: boolean; saleId?: string }> => {
    console.log('🔄 Direct offline processing');
    const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    await queueSaleForSync({
      id: offlineId,
      ...saleData,
      timestamp: Date.now(),
      tenantId: localStorage.getItem('current_tenant_id') || '',
      userId: localStorage.getItem('user_id') || '',
    });

    // Update local stock in background
    setTimeout(() => {
      updateLocalStockBatch(saleData.items);
    }, 0);
    
    return { success: true, saleId: offlineId };
  };

  // Helper function for fallback to offline
  const fallbackToOffline = async (saleData: any): Promise<{ success: boolean; saleId?: string }> => {
    return await processDirectOffline(saleData);
  };

  // Helper function for emergency offline save
  const emergencyOfflineSave = async (saleData: any): Promise<{ success: boolean; saleId?: string }> => {
    try {
      const result = await processDirectOffline(saleData);
      toast.warning("Venta guardada en modo emergencia offline");
      return result;
    } catch (offlineError) {
      console.error('Emergency save failed:', offlineError);
      toast.error("Error crítico: No se pudo procesar la venta");
      return { success: false };
    }
  };

  // Batch stock update for better performance
  const updateLocalStockBatch = async (items: any[]) => {
    try {
      const stockUpdates = items
        .filter(item => item.product?.stock !== undefined)
        .map(item => ({
          productId: item.product_id,
          newStock: Math.max(0, parseFloat(((item.product?.stock || 0) - item.quantity).toFixed(3)))
        }));

      for (const update of stockUpdates) {
        await updateLocalProductStock(update.productId, update.newStock);
      }
    } catch (error) {
      console.warn('Batch stock update warning:', error);
    }
  };

  // Ultra-optimized online sale processing for instant UI response
  const processOnlineSale = async (saleData: any): Promise<{ success: boolean; saleId?: string }> => {
    try {
      console.log('⚡ Lightning-fast online sale processing');
      
      const { data: { user } } = await supabase.auth.getUser();
      const tenantId = user?.user_metadata?.tenant_id || localStorage.getItem('current_tenant_id');

      // Minimal sale data for ultra-fast insertion
      const saleData_ = {
        total: saleData.total,
        payment_method: saleData.paymentMethod,
        customer_id: saleData.customerId,
        tenant_id: tenantId,
        sale_type: saleData.saleType || 'Normal',
        cashier_name: saleData.cashierName,
        date: new Date().toISOString(),
        status: 'completed',
        turno_id: saleData.turnoId || null,
      };

      // Ultra-fast sale insertion with minimal data
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(saleData_)
        .select('id')
        .single();

      if (saleError) {
        console.error('⚡ Sale error:', saleError);
        throw saleError;
      }

      // INSTANT SUCCESS - Background processing for everything else
      setTimeout(async () => {
        try {
          // Process sale items in background
          const saleItems = saleData.items.map((item: any) => ({
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            tenant_id: tenantId,
          }));

          await supabase.from('sale_items').insert(saleItems);
          
          // Update product stock in background
          const stockUpdates = saleData.items
            .filter(item => item.product?.stock !== undefined)
            .map(item => {
              const newStock = Math.max(0, parseFloat(((item.product?.stock || 0) - item.quantity).toFixed(3)));
              return supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', item.product_id)
                .eq('tenant_id', tenantId);
            });

          if (stockUpdates.length > 0) {
            await Promise.allSettled(stockUpdates);
          }

          // Handle mixed payment methods in background with tenant_id validation
          if (saleData.paymentMethod === 'mixed' && saleData.paymentMethods) {
            console.log('SALE_PROCESSING: Processing mixed payment methods in background');
            const mixedPaymentSuccess = await saveMixedPaymentMethods(sale.id, saleData.paymentMethods, tenantId);
            if (!mixedPaymentSuccess) {
              console.error('SALE_PROCESSING_WARNING: Mixed payment methods failed to save');
            }
          }

          // Save product notes in background
          await saveProductNotes(sale.id, saleData.items);

          console.log('⚡ Background: All sale operations completed');
        } catch (bgError) {
          console.warn('Background processing warning:', bgError);
        }
      }, 0);

      console.log('⚡ INSTANT: Online sale completed at light speed!');
      return { success: true, saleId: sale.id };
    } catch (error) {
      console.error('Online sale processing error:', error);
      throw error;
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