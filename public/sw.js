const CACHE_NAME = 'pos-offline-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const urlsToCache = [
  '/',
  '/pos',
  '/products',
  '/dashboard',
  '/offline.html',
  '/src/main.tsx',
  '/src/index.css',
  // Add more critical resources
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip requests to Supabase API when offline - handle in app
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        return fetch(event.request).catch(() => {
          // If both cache and network fail, return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Background sync for queued transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sales') {
    console.log('Background sync triggered for sales');
    event.waitUntil(syncQueuedSales());
  }
});

async function syncQueuedSales() {
  try {
    // Get queued sales from IndexedDB
    const queuedSales = await getQueuedSales();
    
    for (const sale of queuedSales) {
      try {
        // Attempt to sync each sale
        await syncSaleToServer(sale);
        await removeFromQueue(sale.id);
        console.log('Synced sale:', sale.id);
      } catch (error) {
        console.error('Failed to sync sale:', sale.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getQueuedSales() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('POSOfflineDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['queuedSales'], 'readonly');
      const store = transaction.objectStore('queuedSales');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
      
      getAllRequest.onerror = () => {
        reject(getAllRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function syncSaleToServer(sale) {
  // This would be implemented to match your Supabase API calls
  const response = await fetch('/api/sync-sale', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sale),
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync sale');
  }
}

async function removeFromQueue(saleId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('POSOfflineDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['queuedSales'], 'readwrite');
      const store = transaction.objectStore('queuedSales');
      const deleteRequest = store.delete(saleId);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}