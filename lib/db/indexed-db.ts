// Definición de la base de datos IndexedDB para almacenamiento local

// Nombre de la base de datos y versión
const DB_NAME = "ticoPOS"
const DB_VERSION = 1

// Nombres de los almacenes (tablas)
export const STORES = {
  PRODUCTS: "products",
  CUSTOMERS: "customers",
  SALES: "sales",
  INVENTORY: "inventory",
  SETTINGS: "settings",
  SYNC_QUEUE: "syncQueue",
}

// Interfaz para el resultado de operaciones de la base de datos
interface DBResult<T> {
  success: boolean
  data?: T
  error?: string
}

// Función para inicializar la base de datos
export async function initDB(): Promise<DBResult<IDBDatabase>> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      // Se ejecuta cuando se necesita crear o actualizar la estructura de la base de datos
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Crear almacén de productos si no existe
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: "id", autoIncrement: true })
          productStore.createIndex("barcode", "barcode", { unique: true })
          productStore.createIndex("category", "category", { unique: false })
          productStore.createIndex("name", "name", { unique: false })
        }

        // Crear almacén de clientes si no existe
        if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
          const customerStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: "id", autoIncrement: true })
          customerStore.createIndex("email", "email", { unique: false })
          customerStore.createIndex("phone", "phone", { unique: false })
          customerStore.createIndex("type", "type", { unique: false })
        }

        // Crear almacén de ventas si no existe
        if (!db.objectStoreNames.contains(STORES.SALES)) {
          const salesStore = db.createObjectStore(STORES.SALES, { keyPath: "id", autoIncrement: true })
          salesStore.createIndex("date", "date", { unique: false })
          salesStore.createIndex("customerId", "customerId", { unique: false })
          salesStore.createIndex("total", "total", { unique: false })
        }

        // Crear almacén de inventario si no existe
        if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
          const inventoryStore = db.createObjectStore(STORES.INVENTORY, { keyPath: "id", autoIncrement: true })
          inventoryStore.createIndex("productId", "productId", { unique: false })
          inventoryStore.createIndex("type", "type", { unique: false })
          inventoryStore.createIndex("date", "date", { unique: false })
        }

        // Crear almacén de configuración si no existe
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: "id" })
        }

        // Crear almacén para la cola de sincronización si no existe
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncQueueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: "id", autoIncrement: true })
          syncQueueStore.createIndex("store", "store", { unique: false })
          syncQueueStore.createIndex("action", "action", { unique: false })
          syncQueueStore.createIndex("timestamp", "timestamp", { unique: false })
        }
      }

      // Se ejecuta cuando la base de datos se abre correctamente
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        resolve({ success: true, data: db })
      }

      // Se ejecuta cuando hay un error al abrir la base de datos
      request.onerror = (event) => {
        resolve({
          success: false,
          error: `Error al abrir la base de datos: ${(event.target as IDBOpenDBRequest).error?.message}`,
        })
      }
    } catch (error) {
      resolve({ success: false, error: `Error inesperado: ${error}` })
    }
  })
}

// Función genérica para agregar un elemento a un almacén
export async function addItem<T>(storeName: string, item: T): Promise<DBResult<number>> {
  try {
    const { success, data: db, error } = await initDB()
    if (!success || !db) {
      return { success: false, error: error || "No se pudo inicializar la base de datos" }
    }

    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.add(item)

      request.onsuccess = () => {
        // Agregar a la cola de sincronización
        addToSyncQueue(storeName, "add", request.result, item)
        resolve({ success: true, data: request.result as number })
      }

      request.onerror = () => {
        resolve({ success: false, error: request.error?.message || "Error al agregar el elemento" })
      }
    })
  } catch (error) {
    return { success: false, error: `Error inesperado: ${error}` }
  }
}

// Función genérica para obtener un elemento por su ID
export async function getItemById<T>(storeName: string, id: number): Promise<DBResult<T>> {
  try {
    const { success, data: db, error } = await initDB()
    if (!success || !db) {
      return { success: false, error: error || "No se pudo inicializar la base de datos" }
    }

    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        if (request.result) {
          resolve({ success: true, data: request.result as T })
        } else {
          resolve({ success: false, error: "Elemento no encontrado" })
        }
      }

      request.onerror = () => {
        resolve({ success: false, error: request.error?.message || "Error al obtener el elemento" })
      }
    })
  } catch (error) {
    return { success: false, error: `Error inesperado: ${error}` }
  }
}

// Función genérica para actualizar un elemento
export async function updateItem<T>(storeName: string, id: number, item: T): Promise<DBResult<boolean>> {
  try {
    const { success, data: db, error } = await initDB()
    if (!success || !db) {
      return { success: false, error: error || "No se pudo inicializar la base de datos" }
    }

    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.put({ ...item, id })

      request.onsuccess = () => {
        // Agregar a la cola de sincronización
        addToSyncQueue(storeName, "update", id, item)
        resolve({ success: true, data: true })
      }

      request.onerror = () => {
        resolve({ success: false, error: request.error?.message || "Error al actualizar el elemento" })
      }
    })
  } catch (error) {
    return { success: false, error: `Error inesperado: ${error}` }
  }
}

// Función genérica para eliminar un elemento
export async function deleteItem(storeName: string, id: number): Promise<DBResult<boolean>> {
  try {
    const { success, data: db, error } = await initDB()
    if (!success || !db) {
      return { success: false, error: error || "No se pudo inicializar la base de datos" }
    }

    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => {
        // Agregar a la cola de sincronización
        addToSyncQueue(storeName, "delete", id)
        resolve({ success: true, data: true })
      }

      request.onerror = () => {
        resolve({ success: false, error: request.error?.message || "Error al eliminar el elemento" })
      }
    })
  } catch (error) {
    return { success: false, error: `Error inesperado: ${error}` }
  }
}

// Función genérica para obtener todos los elementos de un almacén
export async function getAllItems<T>(storeName: string): Promise<DBResult<T[]>> {
  try {
    const { success, data: db, error } = await initDB()
    if (!success || !db) {
      return { success: false, error: error || "No se pudo inicializar la base de datos" }
    }

    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve({ success: true, data: request.result as T[] })
      }

      request.onerror = () => {
        resolve({ success: false, error: request.error?.message || "Error al obtener los elementos" })
      }
    })
  } catch (error) {
    return { success: false, error: `Error inesperado: ${error}` }
  }
}

// Función para guardar configuración
export async function saveSettings(settings: Record<string, any>): Promise<DBResult<boolean>> {
  try {
    const { success, data: db, error } = await initDB()
    if (!success || !db) {
      return { success: false, error: error || "No se pudo inicializar la base de datos" }
    }

    return new Promise((resolve) => {
      const transaction = db.transaction(STORES.SETTINGS, "readwrite")
      const store = transaction.objectStore(STORES.SETTINGS)

      // Guardar cada sección de configuración por separado
      for (const [key, value] of Object.entries(settings)) {
        const request = store.put({ id: key, value })

        request.onerror = () => {
          resolve({ success: false, error: request.error?.message || `Error al guardar la configuración: ${key}` })
          return
        }
      }

      // Si todo se guarda correctamente
      transaction.oncomplete = () => {
        // Agregar a la cola de sincronización
        addToSyncQueue(STORES.SETTINGS, "update", "settings", settings)
        resolve({ success: true, data: true })
      }

      transaction.onerror = () => {
        resolve({ success: false, error: transaction.error?.message || "Error al guardar la configuración" })
      }
    })
  } catch (error) {
    return { success: false, error: `Error inesperado: ${error}` }
  }
}

// Función para obtener configuración
export async function getSettings(key: string): Promise<DBResult<any>> {
  try {
    const { success, data: db, error } = await initDB()
    if (!success || !db) {
      return { success: false, error: error || "No se pudo inicializar la base de datos" }
    }

    return new Promise((resolve) => {
      const transaction = db.transaction(STORES.SETTINGS, "readonly")
      const store = transaction.objectStore(STORES.SETTINGS)
      const request = store.get(key)

      request.onsuccess = () => {
        if (request.result) {
          resolve({ success: true, data: request.result.value })
        } else {
          resolve({ success: false, error: "Configuración no encontrada" })
        }
      }

      request.onerror = () => {
        resolve({ success: false, error: request.error?.message || "Error al obtener la configuración" })
      }
    })
  } catch (error) {
    return { success: false, error: `Error inesperado: ${error}` }
  }
}

// Función para agregar un elemento a la cola de sincronización
async function addToSyncQueue(
  store: string,
  action: "add" | "update" | "delete",
  id: number | string,
  data?: any,
): Promise<void> {
  try {
    const { success, data: db } = await initDB()
    if (!success || !db) {
      console.error("No se pudo inicializar la base de datos para la cola de sincronización")
      return
    }

    const transaction = db.transaction(STORES.SYNC_QUEUE, "readwrite")
    const syncStore = transaction.objectStore(STORES.SYNC_QUEUE)

    syncStore.add({
      store,
      action,
      recordId: id,
      data,
      timestamp: new Date().toISOString(),
      synced: false,
    })
  } catch (error) {
    console.error("Error al agregar a la cola de sincronización:", error)
  }
}

// Función para obtener elementos pendientes de sincronización
export async function getPendingSyncItems(): Promise<DBResult<any[]>> {
  return getAllItems(STORES.SYNC_QUEUE)
}

// Función para marcar elementos como sincronizados
export async function markAsSynced(ids: number[]): Promise<DBResult<boolean>> {
  try {
    const { success, data: db, error } = await initDB()
    if (!success || !db) {
      return { success: false, error: error || "No se pudo inicializar la base de datos" }
    }

    return new Promise((resolve) => {
      const transaction = db.transaction(STORES.SYNC_QUEUE, "readwrite")
      const store = transaction.objectStore(STORES.SYNC_QUEUE)

      let completed = 0
      let failed = 0

      ids.forEach((id) => {
        const getRequest = store.get(id)

        getRequest.onsuccess = () => {
          if (getRequest.result) {
            const item = getRequest.result
            item.synced = true
            const updateRequest = store.put(item)

            updateRequest.onsuccess = () => {
              completed++
              if (completed + failed === ids.length) {
                resolve({ success: failed === 0, data: failed === 0 })
              }
            }

            updateRequest.onerror = () => {
              failed++
              if (completed + failed === ids.length) {
                resolve({ success: false, error: "Algunos elementos no pudieron ser marcados como sincronizados" })
              }
            }
          } else {
            failed++
            if (completed + failed === ids.length) {
              resolve({ success: false, error: "Algunos elementos no fueron encontrados" })
            }
          }
        }

        getRequest.onerror = () => {
          failed++
          if (completed + failed === ids.length) {
            resolve({ success: false, error: "Error al obtener elementos para sincronización" })
          }
        }
      })
    })
  } catch (error) {
    return { success: false, error: `Error inesperado: ${error}` }
  }
}

// Función para limpiar elementos sincronizados antiguos
export async function cleanupSyncedItems(olderThan: Date): Promise<DBResult<boolean>> {
  try {
    const { success, data: db, error } = await initDB()
    if (!success || !db) {
      return { success: false, error: error || "No se pudo inicializar la base de datos" }
    }

    return new Promise((resolve) => {
      const transaction = db.transaction(STORES.SYNC_QUEUE, "readwrite")
      const store = transaction.objectStore(STORES.SYNC_QUEUE)
      const index = store.index("timestamp")

      const range = IDBKeyRange.upperBound(olderThan.toISOString())
      const request = index.openCursor(range)

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const item = cursor.value
          if (item.synced) {
            cursor.delete()
          }
          cursor.continue()
        }
      }

      transaction.oncomplete = () => {
        resolve({ success: true, data: true })
      }

      transaction.onerror = () => {
        resolve({ success: false, error: transaction.error?.message || "Error al limpiar elementos sincronizados" })
      }
    })
  } catch (error) {
    return { success: false, error: `Error inesperado: ${error}` }
  }
}
