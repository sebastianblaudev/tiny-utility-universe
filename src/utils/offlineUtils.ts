/**
 * Offline functionality utilities for POS system
 */

export interface OfflineSale {
  id: string;
  items: any[];
  total: number;
  paymentMethod: string;
  timestamp: number;
  customerData?: any;
  tenantId: string;
  userId: string;
}

export interface OfflineProduct {
  id: string;
  name: string;
  price: number;
  code: string;
  stock: number;
  category?: string;
  lastSync: number;
}

class OfflineManager {
  private dbName = 'POSOfflineDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('queuedSales')) {
          const salesStore = db.createObjectStore('queuedSales', { keyPath: 'id' });
          salesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('offlineProducts')) {
          const productsStore = db.createObjectStore('offlineProducts', { keyPath: 'id' });
          productsStore.createIndex('code', 'code', { unique: false });
          productsStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('offlineSettings')) {
          db.createObjectStore('offlineSettings', { keyPath: 'key' });
        }
      };
    });
  }

  // Queue a sale for later sync
  async queueSale(sale: OfflineSale): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['queuedSales'], 'readwrite');
      const store = transaction.objectStore('queuedSales');
      const request = store.add(sale);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get all queued sales
  async getQueuedSales(): Promise<OfflineSale[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['queuedSales'], 'readonly');
      const store = transaction.objectStore('queuedSales');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Remove a sale from queue after successful sync
  async removeSaleFromQueue(saleId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['queuedSales'], 'readwrite');
      const store = transaction.objectStore('queuedSales');
      const request = store.delete(saleId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Store products for offline use
  async storeProducts(products: OfflineProduct[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineProducts'], 'readwrite');
      const store = transaction.objectStore('offlineProducts');

      let completed = 0;
      const total = products.length;

      if (total === 0) {
        resolve();
        return;
      }

      products.forEach(product => {
        const request = store.put({ ...product, lastSync: Date.now() });
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  // Get offline products
  async getOfflineProducts(): Promise<OfflineProduct[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineProducts'], 'readonly');
      const store = transaction.objectStore('offlineProducts');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Search products offline
  async searchProducts(query: string): Promise<OfflineProduct[]> {
    const products = await this.getOfflineProducts();
    const lowerQuery = query.toLowerCase();
    
    return products.filter(product => 
      product.name.toLowerCase().includes(lowerQuery) ||
      product.code.toLowerCase().includes(lowerQuery)
    );
  }

  // Update product stock locally
  async updateProductStock(productId: string, newStock: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineProducts'], 'readwrite');
      const store = transaction.objectStore('offlineProducts');
      const getRequest = store.get(productId);

      getRequest.onsuccess = () => {
        const product = getRequest.result;
        if (product) {
          product.stock = newStock;
          const putRequest = store.put(product);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Product not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Store offline settings
  async storeSetting(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineSettings'], 'readwrite');
      const store = transaction.objectStore('offlineSettings');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get offline setting
  async getSetting(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineSettings'], 'readonly');
      const store = transaction.objectStore('offlineSettings');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const offlineManager = new OfflineManager();

// Initialize the offline manager
offlineManager.init().catch(console.error);

// Utility functions
export const isOnline = (): boolean => navigator.onLine;

export const generateOfflineId = (): string => {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Register background sync if supported
export const registerBackgroundSync = async (tag: string): Promise<void> => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'sync' in registration) {
        await (registration as any).sync.register(tag);
        console.log('Background sync registered:', tag);
      }
    } catch (error) {
      console.warn('Background sync not available or failed:', error.message);
    }
  }
};

// Enhanced sync with batch processing and retry logic
export const syncQueuedSales = async (): Promise<void> => {
  if (!isOnline()) return;

  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const queuedSales = await offlineManager.getQueuedSales();
    
    if (queuedSales.length === 0) return;

    console.log(`Starting sync for ${queuedSales.length} queued sales`);
    
    // Process sales in batches to avoid overwhelming the database
    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < queuedSales.length; i += batchSize) {
      batches.push(queuedSales.slice(i, i + batchSize));
    }

    let successCount = 0;
    let errorCount = 0;

    for (const batch of batches) {
      const batchPromises = batch.map(async (sale) => {
        try {
          // Get current user's tenant_id
          const { data: { user } } = await supabase.auth.getUser();
          const tenantId = user?.user_metadata?.tenant_id || localStorage.getItem('current_tenant_id');
          
          if (!tenantId) {
            console.error('No tenant ID available for sync');
            return { success: false, saleId: sale.id, error: 'No tenant ID' };
          }

          // Insert sale with better error handling
          const { data: savedSale, error: saleError } = await supabase
            .from('sales')
            .insert([{
              total: sale.total,
              payment_method: sale.paymentMethod,
              customer_id: sale.customerData?.id || null,
              tenant_id: tenantId,
              sale_type: 'Normal',
              cashier_name: null,
              date: new Date(sale.timestamp).toISOString(),
            }])
            .select()
            .single();

          if (saleError) throw saleError;

          // Insert sale items in batch
          if (sale.items && sale.items.length > 0) {
            const saleItems = sale.items.map((item: any) => ({
              sale_id: savedSale.id,
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
          
          // After successful sync, remove from queue
          await offlineManager.removeSaleFromQueue(sale.id);
          
          console.log('Successfully synced sale:', sale.id);
          return { success: true, saleId: sale.id };
        } catch (error) {
          console.error('Failed to sync sale:', sale.id, error);
          return { success: false, saleId: sale.id, error: error.message };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      });

      // Add small delay between batches to prevent rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Sync completed: ${successCount} successful, ${errorCount} failed`);
    
  } catch (error) {
    console.error('Error during sync:', error);
  }
};