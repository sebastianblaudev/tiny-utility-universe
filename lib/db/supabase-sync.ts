// Servicio para sincronización con Supabase (multitenant)

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getPendingSyncItems, markAsSynced, cleanupSyncedItems, STORES } from "./indexed-db"

// Interfaz para la configuración de Supabase
interface SupabaseConfig {
  url: string
  key: string
  tenantId: string
}

// Cliente de Supabase
let supabaseClient: SupabaseClient | null = null

// Inicializar cliente de Supabase
export function initSupabase(config: SupabaseConfig): SupabaseClient {
  supabaseClient = createClient(config.url, config.key, {
    auth: {
      persistSession: true,
    },
    global: {
      headers: {
        "x-tenant-id": config.tenantId,
      },
    },
  })

  return supabaseClient
}

// Obtener cliente de Supabase
export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient
}

// Verificar si hay conexión a internet
function isOnline(): boolean {
  return navigator.onLine
}

// Sincronizar datos con Supabase
export async function syncWithSupabase(): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar si hay conexión a internet
    if (!isOnline()) {
      return { success: false, error: "No hay conexión a internet" }
    }

    // Verificar si el cliente de Supabase está inicializado
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { success: false, error: "Cliente de Supabase no inicializado" }
    }

    // Obtener elementos pendientes de sincronización
    const { success, data: pendingItems, error } = await getPendingSyncItems()
    if (!success || !pendingItems) {
      return { success: false, error: error || "Error al obtener elementos pendientes de sincronización" }
    }

    // Si no hay elementos pendientes, terminar
    if (pendingItems.length === 0) {
      return { success: true }
    }

    // Agrupar elementos por almacén y acción
    const itemsByStore: Record<string, any[]> = {}
    pendingItems.forEach((item) => {
      if (!itemsByStore[item.store]) {
        itemsByStore[item.store] = []
      }
      itemsByStore[item.store].push(item)
    })

    // Procesar cada almacén
    const syncedIds: number[] = []
    const errors: string[] = []

    for (const [store, items] of Object.entries(itemsByStore)) {
      // Determinar la tabla de Supabase correspondiente
      const tableName = getSupabaseTableName(store)

      // Procesar cada elemento
      for (const item of items) {
        try {
          if (item.synced) {
            syncedIds.push(item.id)
            continue
          }

          let result

          switch (item.action) {
            case "add":
              result = await supabase.from(tableName).insert({ ...item.data, local_id: item.recordId })
              break

            case "update":
              result = await supabase.from(tableName).update(item.data).eq("local_id", item.recordId)
              break

            case "delete":
              result = await supabase.from(tableName).delete().eq("local_id", item.recordId)
              break
          }

          if (result.error) {
            errors.push(`Error al sincronizar ${store}/${item.recordId}: ${result.error.message}`)
          } else {
            syncedIds.push(item.id)
          }
        } catch (err) {
          errors.push(`Error inesperado al sincronizar ${store}/${item.recordId}: ${err}`)
        }
      }
    }

    // Marcar elementos como sincronizados
    if (syncedIds.length > 0) {
      await markAsSynced(syncedIds)
    }

    // Limpiar elementos sincronizados antiguos (más de 7 días)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    await cleanupSyncedItems(sevenDaysAgo)

    // Devolver resultado
    if (errors.length > 0) {
      return {
        success: syncedIds.length > 0,
        error: `Sincronización parcial. Errores: ${errors.join(", ")}`,
      }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: `Error inesperado durante la sincronización: ${error}` }
  }
}

// Obtener nombre de tabla de Supabase según el almacén de IndexedDB
function getSupabaseTableName(store: string): string {
  switch (store) {
    case STORES.PRODUCTS:
      return "products"
    case STORES.CUSTOMERS:
      return "customers"
    case STORES.SALES:
      return "sales"
    case STORES.INVENTORY:
      return "inventory"
    case STORES.SETTINGS:
      return "settings"
    default:
      return store.toLowerCase()
  }
}

// Descargar datos desde Supabase
export async function downloadFromSupabase(): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar si hay conexión a internet
    if (!isOnline()) {
      return { success: false, error: "No hay conexión a internet" }
    }

    // Verificar si el cliente de Supabase está inicializado
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { success: false, error: "Cliente de Supabase no inicializado" }
    }

    // Implementar lógica para descargar datos desde Supabase
    // Esta función se implementaría según las necesidades específicas

    return { success: true }
  } catch (error) {
    return { success: false, error: `Error inesperado durante la descarga: ${error}` }
  }
}

// Configurar sincronización automática
export function setupAutoSync(intervalMinutes = 15): () => void {
  const intervalId = setInterval(
    async () => {
      if (isOnline()) {
        await syncWithSupabase()
      }
    },
    intervalMinutes * 60 * 1000,
  )

  // Sincronizar cuando se recupera la conexión
  window.addEventListener("online", async () => {
    await syncWithSupabase()
  })

  // Devolver función para detener la sincronización automática
  return () => {
    clearInterval(intervalId)
  }
}
