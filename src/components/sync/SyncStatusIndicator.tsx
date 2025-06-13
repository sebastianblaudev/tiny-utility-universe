
import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMasterSync } from '@/hooks/useMasterSync';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const SyncStatusIndicator = () => {
  const { 
    syncStatus, 
    lastSyncTime, 
    error, 
    manualPull, 
    manualPush, 
    checkPendingChanges,
    isInitialized,
    canSync 
  } = useMasterSync();

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'pulling':
        return <Download className="w-4 h-4 animate-spin" />;
      case 'pushing':
        return <Upload className="w-4 h-4 animate-spin" />;
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'idle':
      default:
        return canSync ? <Cloud className="w-4 h-4 text-blue-500" /> : <CloudOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'pulling':
        return 'Descargando...';
      case 'pushing':
        return 'Subiendo...';
      case 'synced':
        return 'Sincronizado';
      case 'error':
        return 'Error';
      case 'idle':
      default:
        return canSync ? 'Conectado' : 'Sin conexión';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'pulling':
      case 'pushing':
        return 'secondary';
      case 'synced':
        return 'default';
      case 'error':
        return 'destructive';
      case 'idle':
      default:
        return canSync ? 'secondary' : 'outline';
    }
  };

  const handleManualSync = async () => {
    if (checkPendingChanges()) {
      await manualPush();
    } else {
      await manualPull();
    }
  };

  if (!isInitialized || !canSync) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={getStatusColor()} className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-xs">{getStatusText()}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-sm">
              <p><strong>Estado:</strong> {getStatusText()}</p>
              {lastSyncTime && (
                <p><strong>Última sincronización:</strong><br />
                  {format(lastSyncTime, 'PPp', { locale: es })}
                </p>
              )}
              {error && (
                <p className="text-red-500"><strong>Error:</strong><br />
                  {error}
                </p>
              )}
              {checkPendingChanges() && (
                <p className="text-orange-500">Hay cambios pendientes por sincronizar</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualSync}
              disabled={syncStatus === 'pulling' || syncStatus === 'pushing'}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${(syncStatus === 'pulling' || syncStatus === 'pushing') ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{checkPendingChanges() ? 'Subir cambios' : 'Actualizar datos'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
