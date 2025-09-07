/**
 * Enhanced offline reliability utilities for robust POS operations
 */

import { supabase } from '@/integrations/supabase/client';
import { offlineManager } from '@/utils/offlineUtils';

interface OfflineConfig {
  maxRetries: number;
  retryDelayMs: number;
  cacheExpiryMs: number;
}

const DEFAULT_CONFIG: OfflineConfig = {
  maxRetries: 5,
  retryDelayMs: 2000,
  cacheExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Ultra-robust sale processing that works regardless of connectivity or date issues
 */
export const processRobustSale = async (saleData: any): Promise<{ success: boolean; saleId?: string }> => {
  const startTime = Date.now();
  const saleId = `sale_${startTime}_${Math.random().toString(36).substr(2, 8)}`;
  
  try {
    // Always queue offline first for guaranteed persistence
    const offlineSale = {
      id: saleId,
      ...saleData,
      timestamp: startTime,
      tenantId: await getRobustTenantId(),
      userId: await getRobustUserId(),
      processedOffline: true,
      dateOverride: new Date().toISOString() // Force current date regardless of system clock
    };

    await offlineManager.queueSale(offlineSale);
    console.log(`ROBUST_SALE: Queued sale ${saleId} offline`);

    // Try immediate online sync in background (non-blocking)
    if (navigator.onLine) {
      setTimeout(async () => {
        try {
          await attemptOnlineSync(offlineSale);
        } catch (error) {
          console.warn('Background sync failed, will retry later:', error);
        }
      }, 100);
    }

    return { success: true, saleId };
  } catch (error) {
    console.error('ROBUST_SALE_ERROR: Even offline save failed:', error);
    
    // Last resort: localStorage backup
    try {
      const backupSales = JSON.parse(localStorage.getItem('emergency_sales_backup') || '[]');
      backupSales.push({ id: saleId, ...saleData, timestamp: startTime });
      localStorage.setItem('emergency_sales_backup', JSON.stringify(backupSales));
      console.log('EMERGENCY_BACKUP: Sale saved to localStorage');
      return { success: true, saleId };
    } catch (backupError) {
      console.error('CRITICAL_ERROR: All sale save methods failed:', backupError);
      return { success: false };
    }
  }
};

/**
 * Robust tenant ID retrieval with multiple fallback strategies
 */
export const getRobustTenantId = async (): Promise<string> => {
  // Strategy 1: Memory cache
  if ((window as any).__cachedTenantId) {
    return (window as any).__cachedTenantId;
  }

  // Strategy 2: localStorage
  const cachedTenantId = localStorage.getItem('current_tenant_id');
  if (cachedTenantId && cachedTenantId !== 'null') {
    (window as any).__cachedTenantId = cachedTenantId;
    return cachedTenantId;
  }

  // Strategy 3: sessionStorage
  const sessionTenantId = sessionStorage.getItem('session_tenant_id');
  if (sessionTenantId) {
    localStorage.setItem('current_tenant_id', sessionTenantId);
    (window as any).__cachedTenantId = sessionTenantId;
    return sessionTenantId;
  }

  // Strategy 4: Auth user metadata
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.tenant_id) {
      const tenantId = user.user_metadata.tenant_id;
      localStorage.setItem('current_tenant_id', tenantId);
      sessionStorage.setItem('session_tenant_id', tenantId);
      (window as any).__cachedTenantId = tenantId;
      return tenantId;
    }
  } catch (error) {
    console.warn('Could not get tenant ID from auth:', error);
  }

  // Strategy 5: Generate emergency tenant ID
  const emergencyTenantId = `emergency_${Date.now()}`;
  localStorage.setItem('emergency_tenant_id', emergencyTenantId);
  console.warn('EMERGENCY: Generated temporary tenant ID:', emergencyTenantId);
  return emergencyTenantId;
};

/**
 * Robust user ID retrieval
 */
export const getRobustUserId = async (): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      return user.id;
    }
  } catch (error) {
    console.warn('Could not get user ID:', error);
  }

  // Fallback to cached or emergency ID
  const cachedUserId = localStorage.getItem('cached_user_id') || `emergency_user_${Date.now()}`;
  return cachedUserId;
};

/**
 * Attempt online synchronization with retry logic
 */
const attemptOnlineSync = async (saleData: any, retries: number = 3): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const tenantId = await getRobustTenantId();
      
      // Insert sale with forced current date
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          total: saleData.total,
          payment_method: saleData.paymentMethod,
          customer_id: saleData.customerId,
          tenant_id: tenantId,
          sale_type: saleData.saleType || 'Normal',
          cashier_name: saleData.cashierName,
          date: new Date().toISOString(), // Always use current date
          status: 'completed',
          turno_id: saleData.turnoId || null,
        })
        .select('id')
        .single();

      if (saleError) throw saleError;

      // Insert sale items
      if (saleData.items && saleData.items.length > 0) {
        const saleItems = saleData.items.map((item: any) => ({
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          tenant_id: tenantId,
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) throw itemsError;
      }

      // Remove from offline queue on success
      await offlineManager.removeSaleFromQueue(saleData.id);
      console.log(`ROBUST_SYNC: Successfully synced sale ${saleData.id}`);
      return;

    } catch (error) {
      console.warn(`ROBUST_SYNC: Attempt ${attempt} failed:`, error);
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, DEFAULT_CONFIG.retryDelayMs * attempt));
      } else {
        throw error;
      }
    }
  }
};

/**
 * Ultra-robust sales history loading that works offline
 */
export const loadRobustSalesHistory = async (): Promise<any[]> => {
  try {
    // Try online first
    if (navigator.onLine) {
      const tenantId = await getRobustTenantId();
      
      const { data: onlineSales, error } = await supabase
        .from('sales')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false });

      if (!error && onlineSales) {
        // Cache for offline use
        localStorage.setItem('cached_sales_history', JSON.stringify({
          data: onlineSales,
          timestamp: Date.now(),
          tenantId
        }));
        return onlineSales;
      }
    }

    // Fallback to cached data
    const cachedHistory = localStorage.getItem('cached_sales_history');
    if (cachedHistory) {
      const parsed = JSON.parse(cachedHistory);
      const cacheAge = Date.now() - parsed.timestamp;
      
      // Use cache if less than 24 hours old
      if (cacheAge < DEFAULT_CONFIG.cacheExpiryMs) {
        console.log('ROBUST_HISTORY: Using cached sales history');
        return parsed.data || [];
      }
    }

    // Final fallback: queued offline sales
    const queuedSales = await offlineManager.getQueuedSales();
    console.log('ROBUST_HISTORY: Using offline queued sales');
    
    return queuedSales.map(sale => ({
      id: sale.id,
      date: new Date(sale.timestamp).toISOString(),
      total: sale.total,
      payment_method: sale.paymentMethod,
      status: 'completed',
      tenant_id: sale.tenantId
    }));

  } catch (error) {
    console.error('ROBUST_HISTORY_ERROR:', error);
    return [];
  }
};

/**
 * Robust connectivity check with fallbacks
 */
export const isRobustlyOnline = (): boolean => {
  // Primary check
  if (!navigator.onLine) return false;
  
  // Secondary check: recent successful network activity
  const lastNetworkSuccess = localStorage.getItem('last_network_success');
  if (lastNetworkSuccess) {
    const timeSinceLastSuccess = Date.now() - parseInt(lastNetworkSuccess);
    // Consider offline if no successful network activity in last 5 minutes
    if (timeSinceLastSuccess > 5 * 60 * 1000) {
      return false;
    }
  }
  
  return true;
};

/**
 * Mark successful network activity
 */
export const markNetworkSuccess = (): void => {
  localStorage.setItem('last_network_success', Date.now().toString());
};

/**
 * Enhanced sync all queued sales with better error handling
 */
export const robustSyncAllSales = async (): Promise<{ synced: number; failed: number }> => {
  if (!isRobustlyOnline()) {
    return { synced: 0, failed: 0 };
  }

  const queuedSales = await offlineManager.getQueuedSales();
  let synced = 0;
  let failed = 0;

  for (const sale of queuedSales) {
    try {
      await attemptOnlineSync(sale, 2); // Fewer retries for batch sync
      synced++;
      markNetworkSuccess();
    } catch (error) {
      console.warn(`Failed to sync sale ${sale.id}:`, error);
      failed++;
    }
  }

  console.log(`ROBUST_BATCH_SYNC: ${synced} synced, ${failed} failed`);
  return { synced, failed };
};