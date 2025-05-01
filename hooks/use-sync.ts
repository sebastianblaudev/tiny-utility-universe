"use client"

import { useState, useEffect, useCallback } from "react"
import { syncWithSupabase, setupAutoSync } from "@/lib/db"
import { useSettings } from "./use-indexed-db"

// Hook para gestionar la sincronización con Supabase
export function useSync() {
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error" | "offline">("synced")
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const { settings } = useSettings()

  // Verificar si hay conexión a internet
  const isOnline = useCallback(() => {
    return navigator.onLine
  }, [])

  // Sincronizar datos con Supabase
  const syncData = useCallback(async () => {
    if (!isOnline()) {
      setSyncStatus("offline")
      return { success: false, error: "No hay conexión a internet" }
    }

    setSyncStatus("syncing")

    try {
      const result = await syncWithSupabase()

      if (result.success) {
        setSyncStatus("synced")
        setLastSyncTime(new Date())
        return { success: true }
      } else {
        setSyncStatus("error")
        return { success: false, error: result.error }
      }
    } catch (error) {
      setSyncStatus("error")
      return { success: false, error: `Error inesperado: ${error}` }
    }
  }, [])

  // Configurar sincronización automática según la configuración
  useEffect(() => {
    if (!settings || !settings.connection) return

    const { offlineMode, syncOnConnect, syncFrequency } = settings.connection

    if (!offlineMode) return

    // Determinar el intervalo de sincronización en minutos
    let intervalMinutes = 60 // Por defecto, cada hora

    if (syncFrequency === "realtime") {
      intervalMinutes = 1 // Cada minuto para simular tiempo real
    } else if (syncFrequency === "hourly") {
      intervalMinutes = 60 // Cada hora
    } else if (syncFrequency === "daily") {
      intervalMinutes = 60 * 24 // Cada día
    } else if (syncFrequency === "manual") {
      intervalMinutes = 0 // No sincronizar automáticamente
    }

    // Si no se debe sincronizar automáticamente, salir
    if (intervalMinutes === 0) return

    // Configurar sincronización automática
    const stopAutoSync = setupAutoSync(intervalMinutes)

    // Sincronizar cuando se recupera la conexión
    const handleOnline = () => {
      if (syncOnConnect) {
        syncData()
      }
    }

    window.addEventListener("online", handleOnline)

    // Actualizar estado cuando se pierde la conexión
    const handleOffline = () => {
      setSyncStatus("offline")
    }

    window.addEventListener("offline", handleOffline)

    // Limpiar al desmontar
    return () => {
      stopAutoSync()
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [settings, syncData])

  return {
    syncStatus,
    lastSyncTime,
    isOnline: isOnline(),
    syncData,
  }
}
