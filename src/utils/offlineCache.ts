/**
 * Enhanced offline caching system with intelligent product management
 */

export interface CachedProduct {
  id: string;
  name: string;
  price: number;
  code: string;
  stock: number;
  category?: string;
  image_url?: string;
  is_weight_based?: boolean;
  lastSync: number;
  cacheMetadata: {
    hits: number;
    lastAccess: number;
    priority: number;
  };
}

export interface CacheMetrics {
  totalProducts: number;
  cacheHits: number;
  cacheMisses: number;
  lastSyncTime: number;
  cacheSize: number;
  hitRatio: number;
}

export interface SyncJob {
  id: string;
  type: 'full' | 'delta' | 'priority';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  error?: string;
  priority: number;
}

class EnhancedOfflineCache {
  private dbName = 'POSEnhancedCache';
  private dbVersion = 2;
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private metrics: CacheMetrics = {
    totalProducts: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastSyncTime: 0,
    cacheSize: 0,
    hitRatio: 0
  };

  async init(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        this.loadMetrics();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Enhanced products cache with metadata
        if (!db.objectStoreNames.contains('cachedProducts')) {
          const productStore = db.createObjectStore('cachedProducts', { keyPath: 'id' });
          productStore.createIndex('code', 'code', { unique: false });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('category', 'category', { unique: false });
          productStore.createIndex('lastSync', 'lastSync', { unique: false });
          productStore.createIndex('priority', 'cacheMetadata.priority', { unique: false });
          productStore.createIndex('hits', 'cacheMetadata.hits', { unique: false });
        }

        // Cache metadata and metrics
        if (!db.objectStoreNames.contains('cacheMetadata')) {
          db.createObjectStore('cacheMetadata', { keyPath: 'key' });
        }

        // Sync jobs queue
        if (!db.objectStoreNames.contains('syncJobs')) {
          const syncStore = db.createObjectStore('syncJobs', { keyPath: 'id' });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('priority', 'priority', { unique: false });
          syncStore.createIndex('startTime', 'startTime', { unique: false });
        }

        // Search index for fast querying
        if (!db.objectStoreNames.contains('searchIndex')) {
          const searchStore = db.createObjectStore('searchIndex', { keyPath: 'term' });
          searchStore.createIndex('productIds', 'productIds', { unique: false, multiEntry: true });
        }
      };
    });
  }

  // Cache-first product retrieval with smart fallback
  async getProduct(productId: string): Promise<CachedProduct | null> {
    if (!this.db) throw new Error('Cache not initialized');

    try {
      const product = await this.getFromCache('cachedProducts', productId);
      if (product) {
        // Update cache metadata
        product.cacheMetadata.hits++;
        product.cacheMetadata.lastAccess = Date.now();
        await this.updateProductMetadata(product);
        this.metrics.cacheHits++;
        return product;
      }
      
      this.metrics.cacheMisses++;
      return null;
    } catch (error) {
      console.error('Error getting product from cache:', error);
      this.metrics.cacheMisses++;
      return null;
    }
  }

  // Intelligent product search with index optimization
  async searchProducts(query: string, limit: number = 50): Promise<CachedProduct[]> {
    if (!this.db) throw new Error('Cache not initialized');

    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];

    try {
      // First check search index for fast results
      const indexedResults = await this.searchFromIndex(lowerQuery);
      if (indexedResults.length > 0) {
        this.metrics.cacheHits++;
        return indexedResults.slice(0, limit);
      }

      // Fallback to full scan with optimized filtering
      const products = await this.getAllCachedProducts();
      const results = products
        .filter(product => 
          product.name.toLowerCase().includes(lowerQuery) ||
          product.code.toLowerCase().includes(lowerQuery) ||
          (product.category && product.category.toLowerCase().includes(lowerQuery))
        )
        .sort((a, b) => {
          // Prioritize by cache metadata and relevance
          const aRelevance = this.calculateRelevance(a, lowerQuery);
          const bRelevance = this.calculateRelevance(b, lowerQuery);
          return bRelevance - aRelevance;
        })
        .slice(0, limit);

      // Update search index for future queries
      if (results.length > 0) {
        await this.updateSearchIndex(lowerQuery, results.map(p => p.id));
      }

      this.metrics.cacheHits++;
      return results;
    } catch (error) {
      console.error('Error searching products:', error);
      this.metrics.cacheMisses++;
      return [];
    }
  }

  // Batch cache products with intelligent prioritization
  async cacheProducts(products: any[], priority: number = 1): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    const transaction = this.db.transaction(['cachedProducts'], 'readwrite');
    const store = transaction.objectStore('cachedProducts');
    const now = Date.now();

    const cachedProducts: CachedProduct[] = products.map(product => ({
      ...product,
      lastSync: now,
      cacheMetadata: {
        hits: 0,
        lastAccess: now,
        priority
      }
    }));

    const promises = cachedProducts.map(product => 
      new Promise<void>((resolve, reject) => {
        const request = store.put(product);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    );

    await Promise.all(promises);
    await this.updateMetrics();
    await this.optimizeCache();

    console.log(`Cached ${products.length} products with priority ${priority}`);
  }

  // Get high-priority products for preloading
  async getHighPriorityProducts(limit: number = 100): Promise<CachedProduct[]> {
    if (!this.db) throw new Error('Cache not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedProducts'], 'readonly');
      const store = transaction.objectStore('cachedProducts');
      const index = store.index('priority');
      const products: CachedProduct[] = [];

      const request = index.openCursor(null, 'prev'); // Descending order
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && products.length < limit) {
          products.push(cursor.value);
          cursor.continue();
        } else {
          resolve(products);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Smart cache cleanup based on usage patterns
  async optimizeCache(): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    const products = await this.getAllCachedProducts();
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const minHits = 1;

    // Remove stale and unused products
    const toRemove = products.filter(product => {
      const age = now - product.lastSync;
      const lastAccess = now - product.cacheMetadata.lastAccess;
      return age > maxAge && 
             product.cacheMetadata.hits < minHits && 
             lastAccess > 24 * 60 * 60 * 1000; // Not accessed in 24h
    });

    if (toRemove.length > 0) {
      await this.removeProductsFromCache(toRemove.map(p => p.id));
      console.log(`Optimized cache: removed ${toRemove.length} stale products`);
    }

    // Update priorities based on usage
    const toUpdate = products
      .filter(p => !toRemove.find(r => r.id === p.id))
      .map(product => {
        const newPriority = this.calculatePriority(product);
        if (newPriority !== product.cacheMetadata.priority) {
          product.cacheMetadata.priority = newPriority;
          return product;
        }
        return null;
      })
      .filter(Boolean) as CachedProduct[];

    if (toUpdate.length > 0) {
      await this.batchUpdateProducts(toUpdate);
    }
  }

  // Get cache metrics for monitoring
  async getCacheMetrics(): Promise<CacheMetrics> {
    await this.updateMetrics();
    return { ...this.metrics };
  }

  // Private helper methods
  private async getFromCache(storeName: string, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCachedProducts(): Promise<CachedProduct[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedProducts'], 'readonly');
      const store = transaction.objectStore('cachedProducts');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async updateProductMetadata(product: CachedProduct): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedProducts'], 'readwrite');
      const store = transaction.objectStore('cachedProducts');
      const request = store.put(product);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async removeProductsFromCache(productIds: string[]): Promise<void> {
    const transaction = this.db!.transaction(['cachedProducts'], 'readwrite');
    const store = transaction.objectStore('cachedProducts');

    const promises = productIds.map(id => 
      new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    );

    await Promise.all(promises);
  }

  private async batchUpdateProducts(products: CachedProduct[]): Promise<void> {
    const transaction = this.db!.transaction(['cachedProducts'], 'readwrite');
    const store = transaction.objectStore('cachedProducts');

    const promises = products.map(product => 
      new Promise<void>((resolve, reject) => {
        const request = store.put(product);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    );

    await Promise.all(promises);
  }

  private async searchFromIndex(query: string): Promise<CachedProduct[]> {
    // Implementation for indexed search
    return [];
  }

  private async updateSearchIndex(term: string, productIds: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['searchIndex'], 'readwrite');
      const store = transaction.objectStore('searchIndex');
      const request = store.put({ term, productIds, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private calculateRelevance(product: CachedProduct, query: string): number {
    let score = 0;
    
    // Exact name match gets highest score
    if (product.name.toLowerCase() === query) score += 100;
    // Name starts with query
    else if (product.name.toLowerCase().startsWith(query)) score += 80;
    // Name contains query
    else if (product.name.toLowerCase().includes(query)) score += 60;
    
    // Code matches
    if (product.code.toLowerCase() === query) score += 90;
    else if (product.code.toLowerCase().includes(query)) score += 50;
    
    // Category matches
    if (product.category && product.category.toLowerCase().includes(query)) score += 30;
    
    // Boost popular products
    score += Math.min(product.cacheMetadata.hits * 2, 20);
    
    // Boost recently accessed products
    const daysSinceAccess = (Date.now() - product.cacheMetadata.lastAccess) / (24 * 60 * 60 * 1000);
    if (daysSinceAccess < 1) score += 10;
    else if (daysSinceAccess < 7) score += 5;
    
    return score;
  }

  private calculatePriority(product: CachedProduct): number {
    const now = Date.now();
    const daysSinceAccess = (now - product.cacheMetadata.lastAccess) / (24 * 60 * 60 * 1000);
    const hits = product.cacheMetadata.hits;
    
    let priority = 1;
    
    // High hits = high priority
    if (hits >= 50) priority = 5;
    else if (hits >= 20) priority = 4;
    else if (hits >= 10) priority = 3;
    else if (hits >= 5) priority = 2;
    
    // Recently accessed items get priority boost
    if (daysSinceAccess < 1) priority = Math.min(priority + 2, 5);
    else if (daysSinceAccess < 7) priority = Math.min(priority + 1, 5);
    
    // Reduce priority for very old items
    if (daysSinceAccess > 30) priority = Math.max(priority - 1, 1);
    
    return priority;
  }

  private async updateMetrics(): Promise<void> {
    const products = await this.getAllCachedProducts();
    
    this.metrics.totalProducts = products.length;
    this.metrics.cacheSize = JSON.stringify(products).length;
    this.metrics.hitRatio = this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0;
    
    // Save metrics to cache
    await this.saveMetadata('metrics', this.metrics);
  }

  private async loadMetrics(): Promise<void> {
    try {
      const savedMetrics = await this.getFromCache('cacheMetadata', 'metrics');
      if (savedMetrics) {
        this.metrics = { ...this.metrics, ...savedMetrics.value };
      }
    } catch (error) {
      console.error('Error loading cache metrics:', error);
    }
  }

  private async saveMetadata(key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cacheMetadata'], 'readwrite');
      const store = transaction.objectStore('cacheMetadata');
      const request = store.put({ key, value, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const enhancedCache = new EnhancedOfflineCache();

// Initialize cache on import
enhancedCache.init().catch(console.error);