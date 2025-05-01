"use client"

import { useSync } from "@/hooks/use-sync"
import { Button } from "@/components/ui/button"
import { CloudIcon as CloudSync } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SyncStatusProps {
  showButton?: boolean
  className?: string
}

export function SyncStatus({ showButton = true, className = "" }: SyncStatusProps) {
  const { syncStatus, lastSyncTime, isOnline, syncData } = useSync()

  const formatLastSync = () => {
    if (!lastSyncTime) return "Nunca"

    // Si fue hoy, mostrar la hora
    const today = new Date()
    const syncDate = new Date(lastSyncTime)

    if (
      today.getDate() === syncDate.getDate() &&
      today.getMonth() === syncDate.getMonth() &&
      today.getFullYear() === syncDate.getFullYear()
    ) {
      return `Hoy, ${syncDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    }

    // Si fue ayer
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (
      yesterday.getDate() === syncDate.getDate() &&
      yesterday.getMonth() === syncDate.getMonth() &&
      yesterday.getFullYear() === syncDate.getFullYear()
    ) {
      return `Ayer, ${syncDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    }

    // Si fue hace más tiempo
    return syncDate.toLocaleDateString() + " " + syncDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  syncStatus === "synced"
                    ? "bg-green-500"
                    : syncStatus === "syncing"
                      ? "bg-blue-500 animate-pulse"
                      : syncStatus === "offline"
                        ? "bg-gray-500"
                        : "bg-red-500"
                }`}
              />
              <span className="text-xs text-muted-foreground">
                {syncStatus === "synced"
                  ? "Sincronizado"
                  : syncStatus === "syncing"
                    ? "Sincronizando..."
                    : syncStatus === "offline"
                      ? "Sin conexión"
                      : "Error de sincronización"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Última sincronización: {formatLastSync()}</p>
            <p>Estado: {isOnline ? "En línea" : "Sin conexión"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showButton && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={() => syncData()}
          disabled={syncStatus === "syncing" || !isOnline}
        >
          <CloudSync className="h-3.5 w-3.5 mr-1" />
          Sincronizar
        </Button>
      )}
    </div>
  )
}
