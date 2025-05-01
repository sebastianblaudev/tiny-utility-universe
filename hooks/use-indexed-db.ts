"use client"

import { useState, useEffect, useCallback } from "react"
import * as db from "@/lib/db"

// Hook genérico para operaciones CRUD con IndexedDB
export function useIndexedDB<T>(storeName: string) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar todos los elementos
  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await db.getAllItems<T>(storeName)
      if (result.success && result.data) {
        setItems(result.data)
      } else {
        setError(result.error || "Error al cargar los datos")
      }
    } catch (err) {
      setError(`Error inesperado: ${err}`)
    } finally {
      setLoading(false)
    }
  }, [storeName])

  // Cargar al montar el componente
  useEffect(() => {
    loadItems()
  }, [loadItems])

  // Agregar un elemento
  const addItem = useCallback(
    async (item: T) => {
      try {
        const result = await db.addItem<T>(storeName, item)
        if (result.success) {
          await loadItems() // Recargar la lista
          return { success: true, id: result.data }
        } else {
          setError(result.error || "Error al agregar el elemento")
          return { success: false, error: result.error }
        }
      } catch (err) {
        const errorMsg = `Error inesperado: ${err}`
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    },
    [storeName, loadItems],
  )

  // Actualizar un elemento
  const updateItem = useCallback(
    async (id: number, item: T) => {
      try {
        const result = await db.updateItem<T>(storeName, id, item)
        if (result.success) {
          await loadItems() // Recargar la lista
          return { success: true }
        } else {
          setError(result.error || "Error al actualizar el elemento")
          return { success: false, error: result.error }
        }
      } catch (err) {
        const errorMsg = `Error inesperado: ${err}`
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    },
    [storeName, loadItems],
  )

  // Eliminar un elemento
  const deleteItem = useCallback(
    async (id: number) => {
      try {
        const result = await db.deleteItem(storeName, id)
        if (result.success) {
          await loadItems() // Recargar la lista
          return { success: true }
        } else {
          setError(result.error || "Error al eliminar el elemento")
          return { success: false, error: result.error }
        }
      } catch (err) {
        const errorMsg = `Error inesperado: ${err}`
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    },
    [storeName, loadItems],
  )

  // Obtener un elemento por ID
  const getItemById = useCallback(
    async (id: number) => {
      try {
        const result = await db.getItemById<T>(storeName, id)
        if (result.success) {
          return { success: true, data: result.data }
        } else {
          return { success: false, error: result.error }
        }
      } catch (err) {
        const errorMsg = `Error inesperado: ${err}`
        return { success: false, error: errorMsg }
      }
    },
    [storeName],
  )

  // Sincronizar con Supabase
  const syncWithCloud = useCallback(async () => {
    try {
      const result = await db.syncWithSupabase()
      if (!result.success) {
        setError(result.error || "Error al sincronizar con la nube")
      }
      return result
    } catch (err) {
      const errorMsg = `Error inesperado: ${err}`
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }, [])

  return {
    items,
    loading,
    error,
    loadItems,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    syncWithCloud,
  }
}

// Hook específico para productos
export function useProducts() {
  return useIndexedDB<db.Product>(db.STORES.PRODUCTS)
}

// Hook específico para clientes
export function useCustomers() {
  return useIndexedDB<db.Customer>(db.STORES.CUSTOMERS)
}

// Hook específico para ventas
export function useSales() {
  return useIndexedDB<db.Sale>(db.STORES.SALES)
}

// Hook específico para movimientos de inventario
export function useInventory() {
  return useIndexedDB<db.InventoryMovement>(db.STORES.INVENTORY)
}

// Hook para configuración
export function useSettings() {
  const [settings, setSettings] = useState<db.Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar configuración
  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Cargar cada sección de configuración
      const sections = ["general", "tax", "printing", "backup", "user", "invoice", "connection"]
      const loadedSettings: any = {}

      for (const section of sections) {
        const result = await db.getSettings(section)
        if (result.success) {
          loadedSettings[section] = result.data
        } else {
          // Si no existe, usar valores predeterminados
          loadedSettings[section] = getDefaultSettings()[section]
        }
      }

      setSettings(loadedSettings as db.Settings)
    } catch (err) {
      setError(`Error inesperado: ${err}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar al montar el componente
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Guardar configuración
  const saveSettings = useCallback(async (newSettings: db.Settings) => {
    try {
      const result = await db.saveSettings(newSettings)
      if (result.success) {
        setSettings(newSettings)
        return { success: true }
      } else {
        setError(result.error || "Error al guardar la configuración")
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMsg = `Error inesperado: ${err}`
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }, [])

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
  }
}

// Valores predeterminados para la configuración
function getDefaultSettings(): db.Settings {
  return {
    general: {
      businessName: "Mi Negocio",
      legalName: "Mi Negocio S.A.",
      taxId: "3-101-123456",
      phone: "2222-3333",
      email: "contacto@minegocio.co.cr",
      address: "San José, Costa Rica",
      website: "www.minegocio.co.cr",
      logo: "/placeholder.svg?height=100&width=100",
      currency: "CRC",
      language: "es-CR",
      timeZone: "America/Costa_Rica",
    },
    tax: {
      ivaEnabled: true,
      ivaRate: 13,
      ivaIncluded: true,
      exemptionEnabled: false,
      exemptionCode: "",
      otherTaxesEnabled: false,
      serviceTaxEnabled: false,
      serviceTaxRate: 10,
    },
    printing: {
      receiptPrinterEnabled: true,
      receiptPrinterName: "Epson TM-T20III",
      receiptWidth: 80,
      receiptHeader: "Mi Negocio\nSan José, Costa Rica\nTel: 2222-3333",
      receiptFooter: "¡Gracias por su compra!",
      showLogo: true,
      showBarcode: true,
      autoPrint: true,
      printCopies: 1,
      emailReceipt: false,
    },
    backup: {
      autoBackup: true,
      backupFrequency: "daily",
      backupTime: "23:00",
      cloudBackup: true,
      localBackup: true,
      backupLocation: "/backups",
      lastBackup: "2023-12-15 23:00:00",
      encryptBackup: true,
    },
    user: {
      multipleUsers: true,
      requireLogin: true,
      sessionTimeout: 30,
      passwordPolicy: "medium",
      twoFactorAuth: false,
    },
    invoice: {
      electronicInvoiceEnabled: true,
      haciendaUsername: "usuario_hacienda",
      haciendaPassword: "••••••••",
      certificateExpiration: "2024-12-31",
      environment: "staging",
      autoSend: true,
      sendCopy: true,
    },
    connection: {
      offlineMode: true,
      syncOnConnect: true,
      syncFrequency: "realtime",
      prioritySyncItems: ["sales", "inventory"],
      connectionTimeout: 30,
    },
  }
}
